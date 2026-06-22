# Ritual Chain — Reference Guide

Source: https://docs.ritualfoundation.org/
Last synced: 2026-06-19

## Network Info

```
Chain ID        : 1979
Currency        : RITUAL (18 decimals, testnet)
Block Time      : ~350ms
TX Types        : EIP-1559 + 0x10, 0x11, 0x12, 0x77
RPC (HTTP)      : https://rpc.ritualfoundation.org
RPC (WebSocket) : wss://rpc.ritualfoundation.org
Explorer        : https://explorer.ritualfoundation.org
Faucet          : https://faucet.ritualfoundation.org
```

## What is Ritual Chain?

The first blockchain where smart contracts can think, see, hear, and act. A TEE-EOVMT chain (EVM with Off-chain Verifiable Machine Tasks). When contracts call a precompile (HTTP, LLM, etc), work happens off-chain inside a TEE. Results are cryptographically tied to the request — can't be faked.

**Key innovation:** Two execution paths over the same state:
- **Replicated execution** — standard EVM (token transfers, storage reads). Every validator re-executes.
- **Delegated execution** — LLM, HTTP, agents, image gen. Runs once inside TEE, result verified not replicated. Both paths share state.

## Precompile Map (16 precompiles)

### Think (AI/Inference)
| Precompile | Address | What it does |
|--|--|--|
| LLM Inference | `0x0802` | Frontier LLM inference in TEE. Model: zai-org/GLM-4.7-FP8 (64K context). Streaming via SSE + EIP-712 signed tokens. |
| Classical Models | `0x0800` | ONNX model inference in TEE |
| FHE Inference | — | Homomorphic encryption inference on encrypted data |

### Create (Generation)
| Precompile | Address | What it does |
|--|--|--|
| Image | — | Image generation in TEE |
| Audio | — | Audio generation in TEE |
| Video | — | Video generation in TEE |

### Act (Execution)
| Precompile | Address | What it does |
|--|--|--|
| Persistent Agent | `0x0820` | Stateful agent with soul, memory, DA, revival (25 fields) |
| Sovereign Agent | `0x080C` | CLI-style agent execution in TEE (Claude Code, Codex, Aider, MCP) |
| HTTP | `0x0801` | Synchronous HTTP calls from contracts |
| Long-Running HTTP | `0x0805` | Async HTTP with polling (30s timeout) |

### Remember (Persistence)
| Precompile | Address | What it does |
|--|--|--|
| DKMS | `0x081B` | Key derivation in TEE (secp256k1) |
| Scheduler | — | Deferred execution at future blocks (block proposer invokes, no keeper needed) |

### Prove (Verification)
| Precompile | Address | What it does |
|--|--|--|
| Ed25519 | — | Signature verification |
| Passkeys / P-256 | — | WebAuthn signature verification |
| ZK Proofs | `0x0806` | Zero-knowledge proof generation/verification |

### Keep Secrets
| Precompile | Address | What it does |
|--|--|--|
| Secrets / ECIES | — | Encrypt credentials, redact PII |

### Pay
| Precompile | Address | What it does |
|--|--|--|
| X402 Payments | — | Monetize APIs, pay-per-call access |

## System Contracts

| Contract | Address | Role |
|--|--|--|
| RitualWallet | `0x532F…3948` | Fee escrow: deposit, lock, balance |
| AsyncJobTracker | `0xC069…AEF5` | Tracks async jobs, enforces sender lock |
| TEEServiceRegistry | `0x9644…f47F` | Registers TEE executors + attestation |
| Scheduler | `0x56e7…D58B` | Deferred execution at future blocks |
| SecretsAccessControl | `0xf9BF…32FD` | Delegated secret access control |
| AsyncDelivery | `0x5A16…39F6` | Delivers two-phase async results via callback |
| AgentHeartbeat | `0xEF50…3aCa` | Persistent agent liveness + revival |
| ModelPricingRegistry | `0x7A85…384f` | Model pricing and availability |

## Autonomous Agents — 7 Properties

An autonomous agent indistinguishable from a human must have ALL seven:

| Property | Meaning | Ritual Primitive |
|--|--|--|
| **Immortal** | Survives crashes, restarts, infra changes | Scheduler heartbeat + Persistent Agent revival |
| **Emancipated** | Controls own keys, no human holds private key | DKMS (`0x081B`) |
| **Teleportable** | Soul + memory portable across environments | DKMS-encrypted state on DA + auto-healing revival |
| **Financially sovereign** | Owns wallet, transacts independently | DKMS wallet + RitualWallet |
| **Web2-interoperable** | Calls APIs, browses web, uses HTTP services | HTTP (`0x0801`) + Long-Running HTTP (`0x0805`) |
| **Private** | Encrypted thought, private communication | TEE enclaves + ECIES + PII redaction |
| **Computationally sovereign** | No one can cut off access to AI | LLM (`0x0802`) + ONNX (`0x0800`) in TEE |

## Persistent Agent (0x0820)

Stateful agent with soul, memory, identity, and data availability. Persists via StorageRef (HuggingFace, GCS, Pinata, IPFS). Revival from CID restores full state. Two-phase async.

## Sovereign Agent (0x080C)

CLI-style agent execution in TEE. Supports: Claude Code, Codex, Aider, MCP. Runs inside enclave, output verifiable.

## RitualWallet

Precompile calls cost fees. Deposit RITUAL into RitualWallet at `0x532F…3948`.

```solidity
interface IRitualWallet {
    function deposit(uint256 lockDuration) external payable;
    function depositFor(address user, uint256 lockDuration) external payable;
    function withdraw(uint256 amount) external;
    function balanceOf(address) external view returns (uint256);
    function lockUntil(address) external view returns (uint256);
}
```

- Deposit with lock period (in blocks)
- Fee locked at submission time
- Withdraw after lock expires

## LLM Inference (0x0802) — Deep Dive

- Model: `zai-org/GLM-4.7-FP8` (64K context, MIT license)
- Self-hosted in TEE fleet, no API keys needed
- Streaming: SSE with EIP-712 signed tokens
- Response in `spcCalls[0].output` (viem strips it — use raw `eth_getTransactionReceipt`)
- ~0.31 RITUAL deposit requirement per call (escrow, mostly returned)
- EIP-1559 tx mandatory (legacy not supported)
- 1 async precompile per tx
- Gas: ~5,000,000

## Key Architecture Concepts

**TEE-EOVMT** — EVM with Off-chain Verifiable Machine Tasks. Work happens off-chain in TEE, results verified on-chain.

**Superposition** — Two execution models (replicated + delegated) coexisting over a single state machine, chosen per-transaction.

**Enshrined** — Infrastructure is part of the chain's execution layer, not external contracts. Block builder enforces sender lock, async lifecycle tracked via tx types.

**Why not off-chain bots?** Nobody can verify results. On Ritual, execution runs in TEE enclaves with attestation registered on-chain. Inputs ECIES-encrypted to executor's public key.

## Why Ritual Matters

"Not interesting because it has precompiles. Interesting because those primitives let you build systems that no other major L1 can host natively: sovereign agents, identity markets, private multimodal interfaces, agent-native companies, and market structure designed for machine participants."

## For Ritty.ai Context

Ritty.ai uses:
- **LLM Inference (0x0802)** — on-chain chat with GLM-4.7-FP8
- **RitualWallet** — fee escrow for inference
- **TEEServiceRegistry** — discover live LLM executors
- **Marketplace contract** — agent rental system
- **Profile contract** — user profiles

Key talking points:
- "Every chat response generated on-chain via Ritual precompile 0x0802"
- "Verifiable on explorer — tx hash per response"
- "Model runs inside TEE, can't be faked"
- "No API keys needed — self-hosted in Ritual's TEE fleet"

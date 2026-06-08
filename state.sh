# Ritty.ai — State Checkpoint
## Updated: 2026-06-06

### Deployed
- **URL:** https://ritty-ai.vercel.app
- **Platform:** Vercel (production)
- **Project ID:** prj_aMFrzR6G7Us311Ekq14TXLaOpSLx
- **Org:** team_GvqrxP49nRFKGg3ZS8VA8cFU

### Completed
- [x] Landing page (Replit-style flow)
- [x] Marketplace page
- [x] Create Agent page
- [x] Dashboard page
- [x] i18n (5 bahasa: EN, ID, FIL, KO, HI) — native `<select>` approach
- [x] Language switcher fixed (Claude's ref + onClick trick)
- [x] Brand: Ritty.ai (logo #3 chosen, file pending)
- [x] Color palette: Ritual Native (#050505 bg, #40FFAF green)
- [x] Typography: Space Grotesk + DM Sans
- [x] PRD written
- [x] Smart contracts scaffolded (AgentMarketplace.sol)
- [x] Vercel SSO/password protection disabled
- [x] suppressHydrationWarning fix
- [x] "Launch App" button (no wallet on landing)

### Pending
- [ ] Logo SVG/PNG file (user chose #3, hasn't sent file)
- [ ] Custom domain (ritty.ai)
- [ ] GitHub auto-deploy setup
- [ ] Smart contract deployment to Ritual testnet
- [ ] ABI integration with frontend
- [ ] Wallet connect on marketplace/create/dashboard
- [ ] Agent rental flow (1h/8h/24h/1wk + custom)
- [ ] 5% platform fee logic
- [ ] Persistent (0x0820) + Sovereign (0x080C) agent support

### Tech Notes
- Vercel deploy: `npx vercel --yes --prod --token=TOKEN`
- Then alias: `npx vercel alias set frontend-azure-chi-65.vercel.app ritty-ai.vercel.app --token=TOKEN`
- VPS2: 84.252.123.65 (4GB RAM, NOT for production builds)
- Local project: ~/ritual-agent-marketplace/
- Vercel token in memory

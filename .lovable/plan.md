

# Auditoria Completa do Sistema AlphaData

## 1. TIPOGRAFIA — Inconsistências Detectadas

O sistema usa **4 famílias tipográficas diferentes** sem um padrão unificado:

| Página | Fonte Principal | Fonte Dados | Fonte Títulos |
|--------|----------------|-------------|---------------|
| **Auth / Landing** | system sans-serif (hardcoded) | — | system sans-serif |
| **Index (Dashboard)** | DM Sans (via `<style>`) | IBM Plex Mono | Epilogue |
| **Production / Prices** | DM Sans (via `<style>`) | IBM Plex Mono | Epilogue |
| **Sidebar** | DM Sans + Space Mono | Space Mono | Space Mono |
| **Search (AI Analyst)** | DM Sans + Space Mono | Space Mono | Space Mono |
| **Settings / Admin** | Outfit (via Tailwind config) | — | Outfit |
| **Competitors / Risk** | Outfit (via Tailwind config) | — | Outfit |
| **Subscription** | Hardcoded inline styles | — | Inline |

**Problema central:** O `tailwind.config.ts` define `Outfit` como fonte global, mas as páginas Index, Production, Prices e Search injetam `<style>` tags que sobrescrevem com DM Sans, Epilogue e Space Mono. Nenhuma destas fontes extra (DM Sans, Epilogue, Space Mono) está instalada como pacote — são carregadas via Google Fonts CDN no Index.tsx, mas só ficam disponíveis se o utilizador visitar essa página primeiro.

**Plano de correcção:**
- Definir **Outfit** como fonte de corpo e títulos (já instalada via `@fontsource`)
- Manter **IBM Plex Mono** para dados numéricos (já instalada)
- Remover referências a DM Sans, Epilogue e Space Mono
- Eliminar as `<style>` tags inline do Index.tsx, Production.tsx e Prices.tsx, migrando os estilos para classes Tailwind

---

## 2. DESIGN — Inconsistências de Tema

### Tokens de cor conflituantes

- **Auth.tsx e Landing.tsx** redefinem `Button`, `Input` e `Label` localmente com estilos hardcoded (`bg-[#002855]`, `text-[#C8102E]`), ignorando os componentes globais de `src/components/ui/`
- **Index.tsx** injeta CSS variables globais (`--bg-primary: #0A0E1A`, `--text-primary: #E8EDF5`) que sobrescrevem os tokens do Tailwind (`--background`, `--foreground`)
- **Subscription.tsx** usa um sistema de tokens próprio (`BG_DEEP = "#04060D"`, `RED = "#E8192C"`) completamente separado
- **Admin.tsx** usa `ACCENT = "#E8FF47"` (chartreuse) que não aparece em mais nenhuma página

### Problemas com o tema Light/Dark

- O `Index.tsx` força `body { background: var(--bg-secondary) }` via `<style>`, ignorando o sistema `dark/light` do Tailwind
- As páginas que usam `bg-card`, `text-foreground` (Settings, Admin, Risk) funcionam com o toggle. As que usam variáveis inline (Index, Production, Prices, Subscription) ficam sempre em dark

**Plano de correcção:**
- Remover os `GlobalStyles` components que injetam CSS variables conflituantes
- Usar exclusivamente os tokens semânticos do Tailwind
- Auth/Landing mantêm o design isolado (conforme a memória do projecto)
- Uniformizar os accent colors: `#00A3FF` (primary blue), `#C8102E` / `#DC2626` (AlphaData red), `#F5A623` (amber), `#00D4AA` (green)

---

## 3. FLUXO DE CADASTRO — Análise Funcional

### Fluxo actual:
1. Utilizador vai a `/auth` → vê login
2. Clica "Solicitar Acesso" → escolhe Personal ou Organization
3. **Personal:** selecciona empresa pré-definida → preenche dados → email domain validation → signup
4. **Organization:** preenche dados da empresa → signup → cria organização + perfil
5. Após signup, `is_approved = false` por defeito → utilizador não consegue entrar
6. Admin aprova via painel Admin → `is_approved = true`

### Problemas detectados:

**A. Forgot Password não funciona:**
A view `forgot-password` mostra o formulário mas o botão "ENVIAR LINK DE REDEFINIÇÃO" não tem handler — não chama `supabase.auth.resetPasswordForEmail()`. É puramente visual.

**B. PersonalSignupForm usa componentes UI globais (Button, Input, Label do shadcn) dentro de Auth.tsx que redefine esses mesmos componentes localmente.** Isto pode causar conflitos visuais — os formulários de signup usam os componentes globais (estilo dark/Tailwind) enquanto o container Auth.tsx usa componentes locais (estilo branco/institucional).

**C. Checkbox do react-hook-form:** O `PersonalSignupForm` usa `{...register("acceptTerms")}` directamente no `<Checkbox>` do Radix, mas o Radix Checkbox não é um input nativo — o `register` não funciona correctamente. Os checkboxes provavelmente não passam o valor para o form state, impedindo o submit.

**D. `company_type` enum:** O signup pessoal hardcoda `company_type: 'consultora'` mas o enum no DB é `('operadora', 'consultora', 'regulador', 'banco', 'governo', 'outro')`. Se o utilizador é de uma operadora, fica registado como consultora.

**Plano de correcção:**
- Implementar o handler de `resetPasswordForEmail` no forgot-password
- Corrigir os Checkboxes para usar `Controller` do react-hook-form em vez de `register`
- Derivar `company_type` da empresa seleccionada (campo `sector` da `predefined_companies`)
- Alinhar os estilos dos sub-formulários (PersonalSignupForm/OrganizationSignupForm) com o tema da Auth page

---

## 4. SEGURANÇA — Análise

### Pontos positivos:
- Roles armazenados em tabela separada `user_roles` (correcto)
- Funções `SECURITY DEFINER` para `has_role` e `is_super_admin` (correcto)
- RLS habilitado em `user_roles` (correcto)
- Admin check via `supabase.rpc("has_role")` server-side (correcto)
- Trigger automático que atribui role `viewer` a novos utilizadores (correcto)
- `is_approved` check no login impede acesso não autorizado (correcto)

### Pontos de atenção:
- **`useAllUsers`** faz `supabase.from("profiles").select("*")` — depende das RLS policies da tabela `profiles` para restringir acesso. Se a policy permitir select a qualquer `authenticated`, qualquer utilizador logado pode ver todos os perfis.
- **Organization signup** cria a organização antes de criar o utilizador auth. Se o signup auth falhar, fica uma organização órfã no DB sem utilizador associado. Deveria ser envolvido numa transacção ou usar uma edge function.

---

## 5. ASPECTOS GERAIS

### Landing page (`/landing`):
- © 2024 no footer — deveria ser 2026
- O navbar usa `bg-background border-border` (tokens Tailwind) mas o hero usa `bg-[#002855]` hardcoded — funciona porque Auth/Landing são páginas institucionais isoladas

### Pricing vs Subscription:
- Existem **duas páginas de preços** (`/pricing` e `/subscription`) com dados duplicados mas designs completamente diferentes. A Pricing usa componentes shadcn; a Subscription usa inline styles com tokens próprios.

### Mobile:
- `MobileBottomNav` está implementado mas só é montado no `Index.tsx`. As outras páginas (Production, Prices, Risk, etc.) não o incluem.

---

## PLANO DE IMPLEMENTAÇÃO

### Fase 1 — Tipografia e Tokens (prioridade alta)
1. Remover as `<style>` tags com `GlobalStyles` do Index, Production, Prices
2. Migrar todas as referências de DM Sans/Epilogue/Space Mono para Outfit + IBM Plex Mono
3. Remover o Google Fonts CDN import do Index.tsx

### Fase 2 — Fluxo de Cadastro (prioridade alta)
4. Implementar `resetPasswordForEmail` no forgot-password
5. Corrigir Checkboxes com `Controller` no PersonalSignupForm e OrganizationSignupForm
6. Derivar `company_type` do sector da empresa seleccionada
7. Alinhar estilos dos sub-formulários com o tema branco da Auth page

### Fase 3 — Consistência de Design (prioridade média)
8. Unificar tokens de cor da Subscription.tsx com o sistema global
9. Remover accent colors orphaned (chartreuse no Admin)
10. Corrigir © 2024 → 2026 na Landing

### Fase 4 — Segurança (prioridade média)
11. Mover organization signup para uma edge function transaccional
12. Auditar RLS policies da tabela `profiles` para restringir select

### Fase 5 — Mobile e Navegação (prioridade baixa)
13. Incluir `MobileBottomNav` em todas as páginas protegidas


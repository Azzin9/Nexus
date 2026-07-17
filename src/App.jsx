import { createContext, Fragment, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// layout: tenant-detail variant (1 classic, 2 card, 3 split). role: 'Platform Admin' | 'FMO'.
const ThemeContext = createContext({
  layout: 1,
  setLayout: () => {},
  role: 'Platform Admin',
  setRole: () => {},
})

/* ------------------------------------------------------------------ */
/* Icon helper (PrimeIcons)                                           */
/* ------------------------------------------------------------------ */

function Icon({ name, className = '' }) {
  return <i className={`pi ${name} ${className}`} />
}

/* ------------------------------------------------------------------ */
/* Sidebar                                                            */
/* ------------------------------------------------------------------ */

const NAV = [
  {
    title: 'Platform',
    icon: 'pi-briefcase',
    items: [
      { label: 'Dashboard', icon: 'pi-home' },
      { label: 'Organizations', icon: 'pi-building', badge: 1 },
      { label: 'Tenants', icon: 'pi-box', badge: 2 },
      { label: 'Platform Users', icon: 'pi-users', badge: 1 },
      { label: 'Roles & Permissions', icon: 'pi-shield' },
    ],
  },
  {
    title: 'System',
    icon: 'pi-cog',
    items: [
      { label: 'Health & Uptime', icon: 'pi-heart' },
      { label: 'Jobs & Scheduling', icon: 'pi-clock', badge: 37 },
      { label: 'Database', icon: 'pi-database' },
      { label: 'Encryption', icon: 'pi-lock' },
      { label: 'Configuration', icon: 'pi-cog' },
    ],
  },
  {
    title: 'Compliance',
    icon: 'pi-verified',
    items: [
      { label: 'Audit Trail', icon: 'pi-list' },
      { label: 'Request Log', icon: 'pi-file' },
      { label: 'Privacy & Consent', icon: 'pi-eye' },
      { label: 'HIPAA / Breach Log', icon: 'pi-shield' },
      { label: 'Legal Holds', icon: 'pi-flag' },
    ],
  },
  {
    title: 'Infrastructure',
    icon: 'pi-sitemap',
    items: [
      { label: 'Webhooks', icon: 'pi-link' },
      { label: 'Notifications', icon: 'pi-bell' },
      { label: 'File Storage', icon: 'pi-folder' },
      { label: 'Rate Limits', icon: 'pi-filter' },
    ],
  },
]

function Badge({ value, active, alt }) {
  return (
    <span
      className={[
        'ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold leading-none',
        alt
          ? active
            ? 'bg-indigo-600 text-white'
            : 'bg-slate-900 text-white'
          : active
            ? 'bg-white/20 text-white'
            : 'bg-slate-900 text-white',
      ].join(' ')}
    >
      {value}
    </span>
  )
}

function NavGroup({ section, active, open, onToggle, onNavigate }) {
  const { layout, role } = useContext(ThemeContext)
  const alt = layout !== 1 || role === 'FMO'
  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-white/60"
      >
        <Icon name={section.icon} className="shrink-0 text-[15px] text-slate-700" />
        <span className="text-[13px] font-bold text-slate-800">{section.title}</span>
        <Icon
          name={open ? 'pi-chevron-up' : 'pi-chevron-down'}
          className="ml-auto text-[11px] text-slate-400"
        />
      </button>

      {open && (
        <ul className="mt-0.5 space-y-0.5 pb-1">
          {section.items.map((item) => {
            const isActive = item.label === active
            return (
              <li key={item.label}>
                <button
                  type="button"
                  onClick={() => onNavigate(item.label)}
                  className={[
                    'flex w-full items-center rounded-lg py-2 pl-9 pr-3 text-left text-[13px] transition-colors',
                    isActive
                      ? alt
                        ? 'bg-indigo-100 font-semibold text-indigo-700'
                        : 'bg-slate-800 font-semibold text-white shadow-sm'
                      : 'font-medium text-slate-600 hover:bg-white/60',
                  ].join(' ')}
                >
                  <span className="truncate">{item.label}</span>
                  {item.badge != null && <Badge value={item.badge} active={isActive} alt={alt} />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

const NOTIF_TYPE = {
  critical: { icon: 'pi-times-circle', color: 'text-red-600', bg: 'bg-red-50' },
  warning: { icon: 'pi-exclamation-triangle', color: 'text-amber-600', bg: 'bg-amber-50' },
  info: { icon: 'pi-info-circle', color: 'text-blue-600', bg: 'bg-blue-50' },
  success: { icon: 'pi-check-circle', color: 'text-emerald-600', bg: 'bg-emerald-50' },
}

const NOTIFICATIONS = [
  {
    id: 'n1',
    type: 'critical',
    title: 'Job failed: commsfabric-receipt-timeout',
    desc: 'Scheduled job exceeded its timeout and failed.',
    time: '2m ago',
    unread: true,
  },
  {
    id: 'n2',
    type: 'warning',
    title: 'Elevated latency on match-engine',
    desc: 'p95 latency crossed the 820ms threshold.',
    time: '15m ago',
    unread: true,
  },
  {
    id: 'n3',
    type: 'info',
    title: 'New tenant provisioned',
    desc: 'Tenant “testt” is now active.',
    time: '1h ago',
    unread: false,
  },
  {
    id: 'n4',
    type: 'success',
    title: 'Nightly backup completed',
    desc: 'party-database snapshot stored successfully.',
    time: '3h ago',
    unread: false,
  },
]

function NotificationsMenu() {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)
  const unread = NOTIFICATIONS.filter((n) => n.unread).length

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 8, left: Math.max(8, r.right - 320) })
    }
    setOpen((o) => !o)
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        title="Notifications"
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
      >
        <Icon name="pi-bell" className="text-[15px]" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-semibold leading-none text-white">
            {unread}
          </span>
        )}
      </button>

      {open &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div
              className="fixed z-50 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
              style={{ top: pos.top, left: pos.left }}
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <h3 className="text-[14px] font-semibold text-slate-900">
                  Notifications{' '}
                  {unread > 0 && <span className="font-medium text-slate-400">({unread} new)</span>}
                </h3>
                <button className="text-[12px] font-medium text-blue-600 transition-colors hover:text-slate-800">
                  Mark all read
                </button>
              </div>
              <ul className="max-h-[360px] divide-y divide-slate-100 overflow-y-auto">
                {NOTIFICATIONS.map((n) => {
                  const t = NOTIF_TYPE[n.type]
                  return (
                    <li key={n.id}>
                      <button
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                          n.unread ? 'bg-blue-50/40' : ''
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${t.bg}`}
                        >
                          <Icon name={t.icon} className={`text-[14px] ${t.color}`} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-[13px] font-semibold text-slate-800">
                              {n.title}
                            </span>
                            {n.unread && (
                              <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                            )}
                          </span>
                          <span className="mt-0.5 block truncate text-[12px] text-slate-500">
                            {n.desc}
                          </span>
                          <span className="mt-1 block text-[11px] text-slate-400">{n.time}</span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
              <div className="border-t border-slate-100 px-4 py-2.5 text-center">
                <button className="text-[12px] font-semibold text-blue-600 transition-colors hover:text-slate-800">
                  View all notifications
                </button>
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  )
}

function UserMenu({ onNavigate = () => {} }) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const { layout, setLayout } = useContext(ThemeContext)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
        className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-slate-100"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[11px] font-semibold text-white">
          DP
        </span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-[12px] font-semibold text-slate-800">Deepak Pander</span>
          <span className="block text-[10px] tracking-wide text-slate-400">PLATFORMADMIN</span>
        </span>
        <Icon name="pi-chevron-down" className="text-[11px] text-slate-500" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={(e) => {
              e.stopPropagation()
              close()
            }}
          />
          <div className="absolute right-0 z-20 mt-1.5 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
            <div className="flex items-center gap-2 px-2 pb-1.5 pt-1">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[11px] font-semibold text-white">
                DP
              </span>
              <div>
                <div className="text-[13px] font-semibold text-slate-900">Deepak Pander</div>
                <div className="text-[11px] text-slate-400">PLATFORMADMIN</div>
              </div>
            </div>
            <div className="my-1 border-t border-slate-100" />
            <MenuItem
              icon="pi-user"
              label="Profile"
              onClick={() => {
                close()
                onNavigate('Profile')
              }}
            />
            <MenuItem icon="pi-cog" label="Settings" onClick={close} />
            <div className="my-1.5 border-t border-slate-100" />
            <div className="px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Layout
            </div>
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setLayout(n)
                  close()
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[14px] transition-colors ${
                  layout === n ? 'bg-blue-50 font-semibold text-blue-700' : 'font-medium text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon name="pi-th-large" className="w-4 text-[15px]" />
                  Layout {n}
                </span>
                {layout === n && <Icon name="pi-check" className="text-[12px] text-blue-600" />}
              </button>
            ))}
            <div className="my-1.5 border-t border-slate-100" />
            <MenuItem icon="pi-sign-out" label="Sign Out" danger onClick={close} />
          </div>
        </>
      )}
    </div>
  )
}

const CMD_ITEMS = [
  { id: 'nav-david', cat: 'Navigation', kind: 'nav', icon: 'pi-user', title: 'David Diaz', sub: 'Agent • Active • NPN 200000002', to: 'Agents' },
  { id: 'nav-northstar', cat: 'Navigation', kind: 'nav', icon: 'pi-building', title: 'Northstar Financial', sub: 'Agency • FMO • Active', to: 'Agencies' },
  { id: 'nav-cornerstone', cat: 'Navigation', kind: 'nav', icon: 'pi-building', title: 'Cornerstone MGA', sub: 'Agency • MGA • Active', to: 'Agencies' },
  { id: 'nav-nacha', cat: 'Navigation', kind: 'nav', icon: 'pi-server', title: 'NACHA Operations', sub: 'ACH batches & settlement', to: 'NACHA Operations' },
  { id: 'nav-ledger', cat: 'Navigation', kind: 'nav', icon: 'pi-book', title: 'Commission Ledger', sub: 'Producer commissions', to: 'Commission Ledger' },
  { id: 'nav-agents', cat: 'Navigation', kind: 'nav', icon: 'pi-users', title: 'Agents', sub: 'Agent directory', to: 'Agents' },
  { id: 'nav-agencies', cat: 'Navigation', kind: 'nav', icon: 'pi-sitemap', title: 'Agencies', sub: 'Agency hierarchy', to: 'Agencies' },
  { id: 'ins-blocked', cat: 'Data & Insights', kind: 'insight', icon: 'pi-ban', title: 'Payment blocked agents', sub: '3 agents blocked from payout', to: 'Agents' },
  { id: 'ins-inactive', cat: 'Data & Insights', kind: 'insight', icon: 'pi-clock', title: 'Inactive agents', sub: '1 agent inactive 21+ days', to: 'Agents' },
  { id: 'ins-returns', cat: 'Data & Insights', kind: 'insight', icon: 'pi-replay', title: 'Pending returns', sub: '6 returns awaiting resolution', to: 'NACHA Operations' },
  { id: 'ins-failed', cat: 'Data & Insights', kind: 'insight', icon: 'pi-times-circle', title: 'Failed batches', sub: '1 batch failed validation', to: 'NACHA Operations' },
  { id: 'ins-compliance', cat: 'Data & Insights', kind: 'insight', icon: 'pi-exclamation-triangle', title: 'Agencies with compliance issues', sub: '2 agencies need attention', to: 'Agencies' },
  { id: 'ins-licenses', cat: 'Data & Insights', kind: 'insight', icon: 'pi-id-card', title: 'Licenses expiring in 30 days', sub: '4 expiring soon', to: 'Agents' },
  { id: 'act-regagency', cat: 'Actions', kind: 'action', icon: 'pi-plus', title: 'Register new agency', sub: 'Start agency onboarding', to: 'Agencies' },
  { id: 'act-onboard', cat: 'Actions', kind: 'action', icon: 'pi-user-plus', title: 'Onboard agent', sub: 'Add a new agent', to: 'Agents' },
  { id: 'act-invite', cat: 'Actions', kind: 'action', icon: 'pi-send', title: 'Invite agent', sub: 'Send an invitation', to: 'Agents' },
  { id: 'act-batch', cat: 'Actions', kind: 'action', icon: 'pi-server', title: 'Create ACH batch', sub: 'New NACHA batch', to: 'NACHA Operations' },
  { id: 'act-export', cat: 'Actions', kind: 'action', icon: 'pi-file-export', title: 'Export report', sub: 'Download a report' },
  { id: 'act-ach', cat: 'Actions', kind: 'action', icon: 'pi-download', title: 'Download ACH file', sub: 'Latest transmitted file' },
  { id: 'kn-ppd', cat: 'Knowledge', kind: 'knowledge', icon: 'pi-question-circle', title: 'What is PPD?', answer: 'PPD (Prearranged Payment and Deposit) is a NACHA SEC code for consumer ACH transactions — e.g. payroll direct deposit and consumer bill payments.' },
  { id: 'kn-odfi', cat: 'Knowledge', kind: 'knowledge', icon: 'pi-question-circle', title: 'What is ODFI?', answer: 'ODFI (Originating Depository Financial Institution) is the bank that submits ACH entries into the network on behalf of the originator.' },
  { id: 'kn-eligible', cat: 'Knowledge', kind: 'knowledge', icon: 'pi-question-circle', title: 'What does payment eligible mean?', answer: 'An agent is Payment Eligible when compliance, licensing, and carrier appointments are all valid — meaning they can receive commission payouts.' },
  { id: 'kn-settlement', cat: 'Knowledge', kind: 'knowledge', icon: 'pi-question-circle', title: 'How does ACH settlement work?', answer: 'After a batch is transmitted, funds settle between the ODFI and RDFI via the Federal Reserve, typically 1–2 business days after the effective date.' },
  { id: 'kn-onboarding', cat: 'Knowledge', kind: 'knowledge', icon: 'pi-question-circle', title: 'How does onboarding work?', answer: 'Agent onboarding moves a prospect through Screening → Contracting → Active, verifying licenses, background screening, and carrier appointments before activation.' },
  { id: 'kn-health', cat: 'Knowledge', kind: 'knowledge', icon: 'pi-question-circle', title: 'Summarize operational health', answer: 'Operational health is Healthy — return rate 0.42% (below the 1% threshold) and settlement success 99.2%. Watch items: 1 failed batch needs attention and 6 returns awaiting resolution.' },
]
const CMD_PROMPTS = [
  { label: 'Show active agents', id: 'nav-agents' },
  { label: 'Open NACHA Operations', id: 'nav-nacha' },
  { label: 'Find payment blocks', id: 'ins-blocked' },
  { label: 'Show expiring licenses', id: 'ins-licenses' },
  { label: 'Open Northstar agency', id: 'nav-northstar' },
  { label: 'Summarize operational health', id: 'kn-health' },
]
const CMD_RECENT = ['nav-david', 'nav-nacha', 'nav-northstar']
const CMD_CATS = ['Navigation', 'Data & Insights', 'Actions', 'Knowledge']
const CMD_KIND_TAG = { nav: 'Open', insight: 'Insight', action: 'Action', knowledge: 'Answer' }
const CMD_KIND_TONE = {
  nav: 'bg-slate-100 text-slate-500',
  insight: 'bg-blue-50 text-blue-600',
  action: 'bg-indigo-50 text-indigo-600',
  knowledge: 'bg-violet-50 text-violet-600',
}
const cmdById = (id) => CMD_ITEMS.find((x) => x.id === id)

function cmdHighlight(text, q) {
  if (!q) return text
  const i = text.toLowerCase().indexOf(q.toLowerCase())
  if (i < 0) return text
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-transparent font-bold text-indigo-600">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  )
}

function CommandBar({ onNavigate }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [answer, setAnswer] = useState(null)
  const [active, setActive] = useState(-1)
  const inputRef = useRef(null)
  const triggerRef = useRef(null)
  const panelRef = useRef(null)
  const overlayRef = useRef(null)
  const animatingRef = useRef(false)
  const openRef = useRef(open)
  openRef.current = open

  const reducedMotion = () =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  // Geometry that maps the centered modal panel back onto the header search bar.
  const barTransform = () => {
    const trigger = triggerRef.current
    const panel = panelRef.current
    if (!trigger || !panel) return null
    const first = trigger.getBoundingClientRect()
    const last = panel.getBoundingClientRect()
    if (!last.width || !last.height) return null
    return `translate(${first.left - last.left}px, ${first.top - last.top}px) scale(${first.width / last.width}, ${first.height / last.height})`
  }

  const OPEN_STATE = { transform: 'translate(0px, 0px) scale(1, 1)', opacity: 1, borderRadius: '16px' }
  const barState = (t) => ({ transform: t, opacity: 0.72, borderRadius: '10px' })

  // Enter: grow out of the bar into the centered modal.
  useLayoutEffect(() => {
    if (!open) return
    const panel = panelRef.current
    const t = barTransform()
    if (!panel || !t || reducedMotion()) return
    panel.style.transformOrigin = 'top left'
    panel.style.willChange = 'transform, opacity'
    animatingRef.current = true
    const anim = panel.animate([barState(t), OPEN_STATE], {
      duration: 460,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'both',
    })
    overlayRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 300,
      easing: 'ease-out',
      fill: 'both',
    })
    anim.onfinish = () => {
      animatingRef.current = false
      panel.style.willChange = ''
    }
    return () => anim.cancel()
  }, [open])

  // Exit: shrink back into the bar, then unmount.
  const requestClose = () => {
    const panel = panelRef.current
    const t = barTransform()
    if (!panel || !t || reducedMotion() || animatingRef.current) {
      setOpen(false)
      return
    }
    panel.style.transformOrigin = 'top left'
    panel.style.willChange = 'transform, opacity'
    animatingRef.current = true
    const anim = panel.animate([OPEN_STATE, { ...barState(t), opacity: 0 }], {
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 1, 1)',
      fill: 'both',
    })
    overlayRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 300,
      easing: 'ease-in',
      fill: 'both',
    })
    anim.onfinish = () => {
      animatingRef.current = false
      setOpen(false)
    }
  }
  const requestCloseRef = useRef(requestClose)
  requestCloseRef.current = requestClose

  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (openRef.current) requestCloseRef.current()
        else setOpen(true)
      } else if (e.key === 'Escape') {
        if (openRef.current) requestCloseRef.current()
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  useEffect(() => {
    if (open) {
      setQ('')
      setAnswer(null)
      setActive(-1)
      setTimeout(() => inputRef.current?.focus(), 40)
    }
  }, [open])

  const idle = q.trim() === ''
  const filtered = CMD_ITEMS.filter((it) =>
    (it.title + ' ' + (it.sub || '')).toLowerCase().includes(q.toLowerCase()),
  )
  const filteredGroups = CMD_CATS.map((c) => ({ c, items: filtered.filter((it) => it.cat === c) })).filter(
    (g) => g.items.length,
  )
  const recents = CMD_RECENT.map(cmdById)
  const flat = idle ? recents : filteredGroups.flatMap((g) => g.items)

  const select = (it) => {
    if (!it) return
    if (it.kind === 'knowledge') {
      setAnswer(it)
      return
    }
    if (it.to) onNavigate?.(it.to)
    requestClose()
  }

  const onKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, flat.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      select(flat[active])
    }
  }

  const rowEl = (it) => {
    const idx = flat.indexOf(it)
    const on = idx === active
    return (
      <button
        key={it.id}
        onMouseEnter={() => setActive(idx)}
        onClick={() => select(it)}
        className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${on ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
      >
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${CMD_KIND_TONE[it.kind]}`}>
          <Icon name={it.icon} className="text-[13px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold text-slate-800">{cmdHighlight(it.title, q)}</span>
          {it.sub && <span className="block truncate text-[11.5px] text-slate-400">{it.sub}</span>}
        </span>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${CMD_KIND_TONE[it.kind]}`}>
          {CMD_KIND_TAG[it.kind]}
        </span>
        {on && <Icon name="pi-arrow-right" className="shrink-0 text-[10px] text-indigo-400" />}
      </button>
    )
  }

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen(true)}
        className="group flex h-9 w-[340px] max-w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-left transition-colors hover:bg-white"
      >
        <Icon name="pi-search" className="text-[14px] text-slate-400" />
        <span className="flex-1 truncate text-[13px] text-slate-400">Ask Nexus AI or search anything…</span>
        <Icon name="pi-sparkles" className="text-[13px] text-indigo-500" />
        <span className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400">⌘K</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div ref={overlayRef} className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={requestClose} />
          <div className="absolute left-1/2 top-[12vh] w-[660px] max-w-[92vw] -translate-x-1/2">
          <div ref={panelRef} className="overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur-xl">
            {/* Input */}
            <div className="flex items-center gap-2.5 border-b border-slate-100 px-4">
              <Icon name="pi-search" className="text-[15px] text-slate-400" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setActive(-1)
                  setAnswer(null)
                }}
                onKeyDown={onKey}
                placeholder="Ask Nexus AI or search anything…"
                className="h-14 flex-1 bg-transparent text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none"
              />
              <Icon name="pi-sparkles" className="text-[14px] text-indigo-500" />
              <span className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400">Esc</span>
            </div>

            {/* Body */}
            <div className="max-h-[58vh] overflow-y-auto p-2" onMouseLeave={() => setActive(-1)}>
              {answer ? (
                <div className="p-2">
                  <button onClick={() => setAnswer(null)} className="mb-2 inline-flex items-center gap-1 text-[11.5px] font-semibold text-slate-500 hover:text-slate-700">
                    <Icon name="pi-arrow-left" className="text-[10px]" /> Back to results
                  </button>
                  <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4">
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-900">
                      <Icon name="pi-sparkles" className="text-[13px] text-violet-600" /> {answer.title}
                    </div>
                    <p className="mt-2 text-[12.5px] leading-relaxed text-slate-600">{answer.answer}</p>
                  </div>
                </div>
              ) : idle ? (
                <div className="p-1">
                  {/* Greeting */}
                  <div className="rounded-2xl bg-indigo-50/60 p-4">
                    <div className="text-[13px] font-semibold text-slate-800">Hi — I'm your operations copilot 👋</div>
                    <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
                      Ask me to find records, search data, explain statuses, or jump to any page across Nexus.
                    </p>
                  </div>
                  {/* Try asking */}
                  <div className="mt-3 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Try asking</div>
                  <div className="mt-2 flex flex-wrap gap-2 px-1">
                    {CMD_PROMPTS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => select(cmdById(p.id))}
                        className="rounded-full border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50/40 hover:text-indigo-700"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  {/* Recently opened */}
                  <div className="mt-4">
                    <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Recently opened</div>
                    {recents.map((it) => rowEl(it))}
                  </div>
                </div>
              ) : flat.length === 0 ? (
                <div className="px-3 py-10 text-center">
                  <div className="text-[13px] font-semibold text-slate-800">No direct result found.</div>
                  <div className="mt-1 text-[12px] text-slate-400">Try a different term, or ask Nexus AI.</div>
                  <button
                    onClick={() => setAnswer({ title: `“${q}”`, answer: 'I can help you find records, search data, explain statuses, and navigate the platform. Try “payment blocked agents”, “What is PPD?”, or “Open NACHA Operations”.' })}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-[12.5px] font-semibold text-white hover:bg-indigo-700"
                  >
                    <Icon name="pi-sparkles" className="text-[12px]" /> Ask Nexus AI
                  </button>
                </div>
              ) : (
                filteredGroups.map((group) => (
                  <div key={group.c} className="mb-1">
                    <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{group.c}</div>
                    {group.items.map((it) => rowEl(it))}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 border-t border-slate-100 px-4 py-2 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1"><span className="rounded border border-slate-200 px-1">↑↓</span> navigate</span>
              <span className="inline-flex items-center gap-1"><span className="rounded border border-slate-200 px-1">↵</span> select</span>
              <span className="inline-flex items-center gap-1"><span className="rounded border border-slate-200 px-1">esc</span> close</span>
              <span className="ml-auto inline-flex items-center gap-1 font-medium text-indigo-500"><Icon name="pi-sparkles" className="text-[10px]" /> Nexus AI</span>
            </div>
          </div>
          </div>
        </div>
      )}
    </>
  )
}

function Topbar({ onNavigate }) {
  return (
    <header className="relative z-30 flex h-14 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-5">
      <CommandBar onNavigate={onNavigate} />

      <div className="ml-auto flex items-center gap-2">
        <RoleSwitch />
        <NotificationsMenu />
        <UserMenu onNavigate={onNavigate} />
      </div>
    </header>
  )
}

const groupTitleOf = (label) => NAV.find((s) => s.items.some((i) => i.label === label))?.title

function Sidebar({ active, onNavigate, nav = NAV, flat = false }) {
  const { layout, role } = useContext(ThemeContext)
  const alt = layout !== 1 || role === 'FMO'
  const groupOf = (label) => nav.find((s) => s.items.some((i) => i.label === label))?.title
  // Independently expandable groups. Navigating reveals the target section's
  // group without collapsing others; the user can freely open/close any group.
  const [openGroups, setOpenGroups] = useState(() => {
    if (role === 'FMO') return new Set(nav.map((s) => s.title))
    const g = groupOf(active)
    return new Set(g ? [g] : [])
  })

  useEffect(() => {
    const g = groupOf(active)
    if (!g) return
    setOpenGroups((prev) => (prev.has(g) ? prev : new Set(prev).add(g)))
  }, [active])

  const toggleGroup = (title) =>
    setOpenGroups((prev) => {
      const next = new Set(prev)
      next.has(title) ? next.delete(title) : next.add(title)
      return next
    })

  return (
    <aside
      className={`flex w-[228px] shrink-0 flex-col border-r border-slate-200 bg-gradient-to-b ${
        alt ? 'from-[#f8f9fd] to-[#eaecfb]' : 'from-[#fdf3f2] via-[#f5f3fb] to-[#eef2fc]'
      }`}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-1.5 px-4">
        <div className="h-7 w-[30px] shrink-0 overflow-hidden">
          <img src="/ensylon-logo.png" alt="" className="h-full w-auto max-w-none" />
        </div>
        <span className="text-[26px] font-extrabold leading-none tracking-tight text-[#1534C2]">
          nexus
        </span>
      </div>

      <nav className="scroll-thin flex-1 overflow-y-auto px-3 pb-4 pt-1">
        {flat
          ? nav.map((section) => (
              <div key={section.title} className="mb-4">
                <div className="px-3 pb-1.5 pt-3 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  {section.title}
                </div>
                <ul className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = item.label === active
                    return (
                      <li key={item.label}>
                        <button
                          type="button"
                          onClick={() => onNavigate(item.label)}
                          className={[
                            'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition-colors',
                            isActive
                              ? 'bg-indigo-50 font-semibold text-indigo-700'
                              : 'font-medium text-slate-600 hover:bg-slate-100',
                          ].join(' ')}
                        >
                          <Icon
                            name={item.icon}
                            className={`shrink-0 text-[15px] ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}
                          />
                          <span className="truncate">{item.label}</span>
                          {item.badge != null && (
                            <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[11px] font-semibold leading-none text-white">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))
          : nav.map((section) => (
              <NavGroup
                key={section.title}
                section={section}
                active={active}
                open={openGroups.has(section.title)}
                onToggle={() => toggleGroup(section.title)}
                onNavigate={onNavigate}
              />
            ))}
      </nav>
    </aside>
  )
}

/* ------------------------------------------------------------------ */
/* Role switch                                                        */
/* ------------------------------------------------------------------ */

const ROLES = ['Platform Admin', 'FMO']

function RoleSwitch() {
  const { role, setRole } = useContext(ThemeContext)
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
      >
        <Icon name="pi-users" className="text-[13px] text-slate-500" />
        <span className="hidden sm:inline">{role}</span>
        <Icon name="pi-chevron-down" className="text-[11px] text-slate-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={close} />
          <div className="absolute right-0 z-20 mt-1.5 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => {
                  setRole(r)
                  close()
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] transition-colors ${
                  r === role ? 'bg-blue-50 font-semibold text-blue-700' : 'font-medium text-slate-700 hover:bg-slate-50'
                }`}
              >
                {r}
                {r === role && <Icon name="pi-check" className="text-[11px] text-blue-600" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                        */
/* ------------------------------------------------------------------ */

// Breadcrumb labels that map to a real navigable view.
const CRUMB_VIEWS = {
  Tenants: 'Tenants',
}

function Breadcrumb({ trail, onNavigate }) {
  return (
    <nav className="flex items-center gap-2 text-[13px] text-slate-400">
      {trail.map((part, i) => {
        const last = i === trail.length - 1
        const target = CRUMB_VIEWS[part]
        const clickable = !last && target && onNavigate
        return (
          <span key={part} className="flex items-center gap-2">
            {clickable ? (
              <button
                type="button"
                onClick={() => onNavigate(target)}
                className="rounded font-medium text-slate-500 underline-offset-2 transition-colors hover:text-slate-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
              >
                {part}
              </button>
            ) : (
              <span className={last ? 'font-medium text-slate-700' : ''}>{part}</span>
            )}
            {!last && <span className="text-slate-300">/</span>}
          </span>
        )
      })}
    </nav>
  )
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                          */
/* ------------------------------------------------------------------ */

function StatCard({ label, value, valueClass = 'text-slate-900', sub }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-[11px] font-semibold tracking-[0.08em] text-slate-400">
        {label}
      </div>
      <div className={`mt-2 text-[26px] font-bold leading-none ${valueClass}`}>
        {value}
      </div>
      <div className="mt-2 text-[11px] text-slate-400">{sub ?? ' '}</div>
    </div>
  )
}

const ALERTS = [
  { id: 'a1', title: 'Job Failed: commsfabric-receipt-timeout', description: 'Scheduled job exceeded its timeout and failed to complete.', severity: 'critical', status: 'New', attempt: 0, service: 'party-data-lifecycle', ts: '2026-06-21T07:07:15.007575Z' },
  { id: 'a2', title: 'Job Failed: event-outbox-drain', description: 'Outbox drain worker crashed during batch processing.', severity: 'critical', status: 'Active', attempt: 2, service: 'event-pipeline', ts: '2026-06-21T07:05:02.004259Z' },
  { id: 'a3', title: 'Elevated latency: match-engine', description: 'p95 latency exceeded the configured threshold (820ms).', severity: 'warning', status: 'Acknowledged', attempt: 0, service: 'match-engine', ts: '2026-06-21T06:58:02.000000Z' },
  { id: 'a4', title: 'Scheduled maintenance window', description: 'Planned maintenance affecting database availability.', severity: 'info', status: 'Active', attempt: 0, service: 'party-database', ts: '2026-06-21T05:30:00.000000Z' },
]

const ALERT_SEVERITY = {
  critical: {
    label: 'Critical',
    icon: 'pi-times-circle',
    iconColor: 'text-red-600',
    iconBg: 'bg-red-50',
    badge: 'bg-red-50 text-red-600',
    accent: 'border-l-red-600',
  },
  warning: {
    label: 'Warning',
    icon: 'pi-exclamation-triangle',
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
    badge: 'bg-amber-50 text-amber-600',
    accent: 'border-l-amber-500',
  },
  info: {
    label: 'Info',
    icon: 'pi-info-circle',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
    badge: 'bg-blue-50 text-blue-600',
    accent: 'border-l-blue-500',
  },
}

const ALERT_STATUS = {
  New: 'bg-blue-50 text-blue-700',
  Active: 'bg-emerald-50 text-emerald-700',
  Acknowledged: 'bg-slate-100 text-slate-500',
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// '2026-06-21T07:07:15.007Z' -> { date: 'Jun 21, 2026', time: '07:07:15', tz: 'UTC' }
function formatTs(ts) {
  const [datePart, timeRest = ''] = ts.split('T')
  const [y, mo, day] = datePart.split('-')
  return {
    date: `${MONTHS[Number(mo) - 1]} ${Number(day)}, ${y}`,
    time: timeRest.slice(0, 8),
    tz: timeRest.endsWith('Z') ? 'UTC' : '',
  }
}

function MetaItem({ icon, children }) {
  return (
    <span className="flex items-center gap-1">
      <Icon name={icon} className="text-[11px]" />
      {children}
    </span>
  )
}

function AlertCard({ alert, onClick }) {
  const cfg = ALERT_SEVERITY[alert.severity]
  const { time, tz } = formatTs(alert.ts)

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-white py-3.5 pl-4 pr-10 text-left shadow-sm transition-all hover:border-slate-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
    >
      <span
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${cfg.iconBg}`}
      >
        <Icon name={cfg.icon} className={`text-[16px] ${cfg.iconColor}`} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className={`truncate text-[14px] font-semibold leading-tight ${cfg.iconColor}`}>
            {alert.title}
          </h3>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-slate-500">
          <MetaItem icon="pi-clock">{time}</MetaItem>
          {tz && <MetaItem icon="pi-globe">{tz}</MetaItem>}
          <MetaItem icon="pi-replay">Attempt {alert.attempt}</MetaItem>
        </div>
      </div>

      <Icon
        name="pi-chevron-right"
        className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-slate-300 transition-colors group-hover:text-slate-500"
      />
    </button>
  )
}

const ALERT_FILTERS = ['All', 'Critical', 'Warning', 'Info']

function RecentAlerts({ onNavigate }) {
  const [filter, setFilter] = useState('All')

  const counts = {
    All: ALERTS.length,
    Critical: ALERTS.filter((a) => a.severity === 'critical').length,
    Warning: ALERTS.filter((a) => a.severity === 'warning').length,
    Info: ALERTS.filter((a) => a.severity === 'info').length,
  }
  const filtered =
    filter === 'All' ? ALERTS : ALERTS.filter((a) => a.severity === filter.toLowerCase())

  return (
    <section className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 px-5 pt-4">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-900">
            Recent Alerts <span className="font-medium text-slate-400">({ALERTS.length})</span>
          </h2>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('Health & Uptime')}
          className="inline-flex shrink-0 items-center gap-1 rounded text-[12px] font-medium text-blue-600 transition-colors hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
        >
          View All <Icon name="pi-arrow-right" className="text-[11px]" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 px-5 pb-3 pt-3">
        {ALERT_FILTERS.map((f) => {
          const active = filter === f
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={active}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-[13px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
                active
                  ? 'border-transparent bg-gradient-to-r from-[#1e293b] to-[#334155] text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-transparent hover:bg-gradient-to-r hover:from-[#1e293b] hover:to-[#334155] hover:text-white'
              }`}
            >
              {f !== 'All' && (
                <Icon
                  name={ALERT_SEVERITY[f.toLowerCase()].icon}
                  className="text-[12px]"
                />
              )}
              {f} ({counts[f]})
            </button>
          )
        })}
      </div>

      <div className="h-[368px] space-y-2.5 overflow-y-auto px-5 pb-5">
        {filtered.length > 0 ? (
          filtered.map((a) => (
            <AlertCard key={a.id} alert={a} onClick={() => onNavigate('Health & Uptime')} />
          ))
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
            <Icon name="pi-check-circle" className="text-[22px] text-emerald-500" />
            <p className="text-[13px] font-medium text-slate-600">
              No {filter.toLowerCase()} alerts
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

function PanelHeader({ title }) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
      <a
        href="#"
        className="inline-flex items-center gap-1 text-[12px] font-medium text-blue-600 transition-colors hover:text-blue-700"
      >
        View all <Icon name="pi-arrow-right" className="text-[11px]" />
      </a>
    </div>
  )
}

const QUICK_START = [
  {
    key: 'org',
    title: 'Create organization',
    desc: 'Set up a new organization to group tenants, users, and billing in one place.',
    panel: 'from-blue-100 via-indigo-50 to-white',
    c1: '#3b82f6',
    c2: '#4f46e5',
    nav: 'Organizations',
  },
  {
    key: 'tenant',
    title: 'Provision tenant',
    desc: 'Spin up an isolated tenant environment with its own data, config, and encryption.',
    panel: 'from-violet-100 via-fuchsia-50 to-white',
    c1: '#8b5cf6',
    c2: '#c026d3',
    nav: 'Tenants/New',
  },
  {
    key: 'users',
    title: 'Invite platform users',
    desc: 'Add team members and assign roles and permissions across the platform.',
    panel: 'from-emerald-100 via-teal-50 to-white',
    c1: '#10b981',
    c2: '#0d9488',
    nav: 'Platform Users',
  },
]

function CardIllustration({ card }) {
  const gid = `qs-grad-${card.key}`
  const grad = (
    <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
      <stop stopColor={card.c1} />
      <stop offset="1" stopColor={card.c2} />
    </linearGradient>
  )

  if (card.key === 'org') {
    return (
      <svg viewBox="0 0 200 130" fill="none" className="h-[104px] w-auto drop-shadow-md">
        <defs>{grad}</defs>
        <rect x="58" y="48" width="34" height="58" rx="8" fill={card.c1} opacity="0.22" />
        <rect x="84" y="26" width="46" height="80" rx="10" fill={`url(#${gid})`} />
        <g fill="#fff" opacity="0.9">
          <rect x="92" y="38" width="10" height="8" rx="2" />
          <rect x="112" y="38" width="10" height="8" rx="2" />
          <rect x="92" y="54" width="10" height="8" rx="2" />
          <rect x="112" y="54" width="10" height="8" rx="2" />
          <rect x="92" y="70" width="10" height="8" rx="2" />
          <rect x="112" y="70" width="10" height="8" rx="2" />
        </g>
        <rect x="100" y="90" width="14" height="16" rx="3" fill="#fff" opacity="0.95" />
        <path d="M152 30l2.6 7 7 2.6-7 2.6-2.6 7-2.6-7-7-2.6 7-2.6z" fill={card.c2} opacity="0.5" />
      </svg>
    )
  }

  if (card.key === 'tenant') {
    return (
      <svg viewBox="0 0 200 130" fill="none" className="h-[104px] w-auto drop-shadow-md">
        <defs>{grad}</defs>
        <rect x="56" y="40" width="48" height="62" rx="12" fill={card.c1} opacity="0.22" />
        <rect x="72" y="28" width="60" height="74" rx="16" fill={`url(#${gid})`} />
        <g fill="#fff">
          <circle cx="112" cy="54" r="5" />
          <circle cx="112" cy="76" r="5" />
          <circle cx="90" cy="65" r="5" />
        </g>
        <g stroke="#fff" strokeWidth="2.6">
          <line x1="94" y1="62" x2="108" y2="56" />
          <line x1="94" y1="68" x2="108" y2="74" />
        </g>
        <path d="M152 30l2.6 7 7 2.6-7 2.6-2.6 7-2.6-7-7-2.6 7-2.6z" fill={card.c2} opacity="0.5" />
      </svg>
    )
  }

  // users
  return (
    <svg viewBox="0 0 200 130" fill="none" className="h-[104px] w-auto drop-shadow-md">
      <defs>{grad}</defs>
      <g opacity="0.35" fill={card.c1}>
        <circle cx="76" cy="54" r="15" />
        <rect x="56" y="74" width="40" height="32" rx="16" />
      </g>
      <circle cx="112" cy="50" r="18" fill={`url(#${gid})`} />
      <rect x="88" y="72" width="48" height="34" rx="17" fill={`url(#${gid})`} />
      <circle cx="142" cy="44" r="12" fill="#fff" />
      <g stroke={card.c2} strokeWidth="3" strokeLinecap="round">
        <line x1="142" y1="39" x2="142" y2="49" />
        <line x1="137" y1="44" x2="147" y2="44" />
      </g>
    </svg>
  )
}

function QuickStartCard({ card, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
    >
      <div
        className={`flex h-32 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${card.panel}`}
      >
        <div className="transition-transform group-hover:scale-105">
          <CardIllustration card={card} />
        </div>
      </div>
      <div className="px-2.5 pb-2 pt-3.5">
        <h3 className="text-[14px] font-semibold text-slate-900">{card.title}</h3>
        <p className="mt-1.5 text-[13px] leading-snug text-slate-500">{card.desc}</p>
      </div>
    </button>
  )
}

function QuickStart({ onNavigate }) {
  return (
    <div>
      <h2 className="text-[15px] font-semibold text-slate-900">Start building from scratch</h2>
      <div className="mt-4 grid grid-cols-3 gap-4">
        {QUICK_START.map((card) => (
          <QuickStartCard key={card.title} card={card} onClick={() => onNavigate(card.nav)} />
        ))}
      </div>
    </div>
  )
}

// Elapsed seconds -> "0s ago", "45s ago", "2m 05s ago"
function formatElapsed(total) {
  if (total < 60) return `${total}s ago`
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}m ${String(s).padStart(2, '0')}s ago`
}

function Dashboard({ onNavigate }) {
  // 0 => all systems operational; > 0 => degraded
  const failedChecks = 2
  const degraded = failedChecks > 0

  const [refreshing, setRefreshing] = useState(false)
  const [seconds, setSeconds] = useState(0)

  // Tick the "last refreshed" timer every second.
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const handleRefresh = () => {
    if (refreshing) return
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
      setSeconds(0)
    }, 900)
  }

  return (
    <div className="mx-auto max-w-[1240px] px-7 py-6">
      {/* Title row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-bold text-slate-900">Dashboard</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh all dashboard data"
              aria-label="Refresh all dashboard data"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-800 transition-colors hover:border-slate-800 hover:bg-slate-800 hover:text-white disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
            >
              <Icon
                name="pi-refresh"
                className={`text-[12px] ${refreshing ? 'animate-spin' : ''}`}
              />
            </button>
            <p className="text-[12px] text-slate-400">
              {refreshing ? 'Refreshing…' : `Last refreshed ${formatElapsed(seconds)}`} · local · 0.1.1
            </p>
          </div>
        </div>
      </div>

      {/* System status banner */}
      <div
        className={`mt-5 flex items-center justify-between gap-4 rounded-xl border px-4 py-3 shadow-sm ${
          degraded
            ? 'border-[#FECACA] bg-gradient-to-br from-rose-50 via-red-50 to-red-100/70'
            : 'border-emerald-200 bg-emerald-50/70'
        }`}
      >
        {degraded ? (
          <div className="flex items-center gap-2.5" role="alert">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
              <Icon name="pi-exclamation-triangle" className="text-[15px] text-red-600" />
            </span>
            <span>
              <span className="block text-[14px] font-bold text-red-700">
                Service Degradation Detected
              </span>
              <span className="mt-0.5 block text-[12px] font-normal text-red-700">
                {failedChecks} Readiness {failedChecks === 1 ? 'Check' : 'Checks'} Failed
              </span>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[14px] font-semibold text-emerald-700">
            <Icon name="pi-check-circle" className="text-[15px]" />
            All Systems Operational
          </div>
        )}

        <button
          onClick={() => onNavigate('Health & Uptime')}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-800 shadow-sm transition-colors duration-200 hover:border-transparent hover:bg-gradient-to-r hover:from-[#1e293b] hover:to-[#334155] hover:text-white"
        >
          <Icon name="pi-eye" className="text-[13px]" />
          View Details
        </button>
      </div>

      {/* Stat cards */}
      <div
        className={`transition-opacity duration-300 ${refreshing ? 'opacity-50' : 'opacity-100'}`}
        aria-busy={refreshing}
      >
        <div className="mt-4 grid grid-cols-4 gap-4">
          <StatCard label="Organizations" value="1" sub="1 active" />
          <StatCard label="Tenants" value="2" sub="1 active · 1 decommissioned" />
          <StatCard label="Platform users" value="4" />
          <StatCard label="Uptime (30d)" value="—" />
        </div>

        <div className="mt-4 grid grid-cols-4 gap-4">
          <StatCard
            label="Request rate"
            value="0.1 rps"
            valueClass="text-blue-600"
            sub="mean: 149ms · max 129ms"
          />
          <StatCard
            label="Error rate"
            value="0.00%"
            valueClass="text-emerald-600"
            sub="4xx 0.00% · 5xx 0.00%"
          />
          <StatCard label="Active jobs" value="154" sub="154 running · 143 failed" />
          <StatCard label="SLO burn rate" value="—" />
        </div>
      </div>

      {/* Quick start */}
      <div className="mt-6">
        <QuickStart onNavigate={onNavigate} />
      </div>

      {/* Bottom panels */}
      <div className="mt-6 grid grid-cols-2 gap-5">
        <RecentAlerts onNavigate={onNavigate} />

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <PanelHeader title="Organization Overview" />
          <div className="px-5 pb-5">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] font-semibold tracking-[0.06em] text-slate-400">
                  <th className="pb-2 font-semibold">Organization</th>
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2 text-right font-semibold">Tenants</th>
                </tr>
              </thead>
              <tbody>
                <tr className="text-[13px]">
                  <td className="py-3">
                    <a href="#" className="font-medium text-blue-600 hover:underline">
                      Ensylon Nexus Test Org
                    </a>
                  </td>
                  <td className="py-3">
                    <span className="inline-flex items-center rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-emerald-700">
                      ACTIVE
                    </span>
                  </td>
                  <td className="py-3 text-right text-slate-500">2 / 100</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tenants                                                            */
/* ------------------------------------------------------------------ */

const TAG_STYLES = {
  purple: 'text-purple-600 bg-purple-50 ring-purple-200',
  green: 'text-emerald-600 bg-emerald-50 ring-emerald-200',
  blue: 'text-blue-600 bg-blue-50 ring-blue-200',
}

const STATUS_STYLES = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  SUSPENDED: 'bg-amber-100 text-amber-700',
}

const TENANTS = [
  {
    initials: 'L',
    name: 'Lakme corporation',
    org: 'Acme Dev Org',
    slug: 'testt',
    status: 'ACTIVE',
    users: '—',
    plan: 'STARTER',
    region: 'us-east-1',
    tags: [
      { label: 'SHARED', color: 'purple' },
      { label: 'LIVE', color: 'green' },
    ],
    detail: {
      id: 'fb95ecbf-6fc1-49f6-8872-8ffec0273403',
      displayName: 'Lakme corporation',
      slug: 'Randomtest',
      isolation: 'FULLY_DEDICATED',
      isolationLabel: 'FULLY DEDICATED',
      plan: 'PROFESSIONAL',
      region: 'us-east-1',
      contactEmail: 'test32@gmail.com',
      created: '06/26/2026 15:03:24',
      stats: { activeUsers: 1, apiKeys: 0, webhooks: 0, uptime: '—' },
      timeline: [{ date: 'Jun 26, 2026', title: 'Tenant ACTIVE', note: 'test' }],
    },
  },
  {
    initials: 'LT',
    name: 'Local Dev Tenant',
    org: 'Acme Dev Org',
    slug: 'dev-local',
    status: 'SUSPENDED',
    users: '—',
    plan: '—',
    region: '—',
    tags: [
      { label: 'SHARED', color: 'purple' },
      { label: 'LIVE', color: 'green' },
      { label: 'SANDBOX', color: 'blue' },
    ],
    detail: {
      id: 'a17c9d20-3b54-4e81-9f02-12ab7c4e0091',
      displayName: 'Local Dev Tenant',
      slug: 'dev-local',
      isolation: 'SHARED',
      isolationLabel: 'SHARED',
      plan: 'STARTER',
      region: '—',
      contactEmail: 'dev@example.com',
      created: '06/20/2026 09:41:10',
      stats: { activeUsers: 0, apiKeys: 0, webhooks: 0, uptime: '—' },
      timeline: [{ date: 'Jun 20, 2026', title: 'Tenant SUSPENDED', note: 'dev-local' }],
    },
  },
]

function Tag({ label, color }) {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold tracking-wide ring-1 ${TAG_STYLES[color]}`}
    >
      {label}
    </span>
  )
}

function MenuItem({ icon, label, danger, focused, onClick }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
      className={[
        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[14px] font-medium transition-colors',
        danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50',
        focused ? 'ring-1 ring-blue-500' : '',
      ].join(' ')}
    >
      <Icon name={icon} className="w-4 text-[15px]" />
      {label}
    </button>
  )
}

const MENU_WIDTH = 224 // w-56

function TenantMenu() {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)
  const close = () => setOpen(false)

  const toggle = (e) => {
    e.stopPropagation()
    if (!open) {
      const r = btnRef.current?.getBoundingClientRect()
      if (r) {
        const left = Math.min(
          window.innerWidth - MENU_WIDTH - 8,
          Math.max(8, r.right - MENU_WIDTH),
        )
        setPos({ top: r.bottom + 6, left })
      }
    }
    setOpen((o) => !o)
  }

  // Close on scroll/resize so the fixed menu never detaches from its button.
  useEffect(() => {
    if (!open) return
    const handler = () => close()
    window.addEventListener('scroll', handler, true)
    window.addEventListener('resize', handler)
    return () => {
      window.removeEventListener('scroll', handler, true)
      window.removeEventListener('resize', handler)
    }
  }, [open])

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50"
      >
        <Icon name="pi-ellipsis-v" className="text-[13px]" />
      </button>

      {open &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={(e) => {
                e.stopPropagation()
                close()
              }}
            />
            <div
              className="fixed z-50 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
              style={{ top: pos.top, left: pos.left }}
              onClick={(e) => e.stopPropagation()}
            >
              <MenuItem icon="pi-pencil" label="Edit" onClick={close} />
              <MenuItem icon="pi-pause" label="Suspend" onClick={close} />
              <div className="my-1.5 border-t border-slate-100" />
              <MenuItem icon="pi-cloud" label="Enable sandbox" onClick={close} />
              <MenuItem icon="pi-bolt" label="Disable live env" onClick={close} />
              <div className="my-1.5 border-t border-slate-100" />
              <MenuItem icon="pi-ban" label="Decommission" danger onClick={close} />
              <MenuItem icon="pi-trash" label="Delete" danger onClick={close} />
            </div>
          </>,
          document.body,
        )}
    </div>
  )
}

function StatBox({ value, label }) {
  return (
    <div className="flex flex-col rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-3">
      <div className="text-[14px] font-bold text-slate-900">{value}</div>
      <div className="mt-1 text-[11px] font-semibold tracking-[0.08em] text-slate-400">
        {label}
      </div>
    </div>
  )
}

const CARD_TAG_META = {
  LIVE: { icon: 'pi-bolt', text: 'Production', cls: 'text-slate-600 bg-white ring-slate-300' },
  SANDBOX: { icon: 'pi-box', cls: 'text-slate-600 bg-white ring-slate-300' },
  SHARED: { icon: 'pi-share-alt', cls: 'text-slate-600 bg-white ring-slate-300' },
  PRIVATE: { icon: 'pi-lock', cls: 'text-slate-600 bg-white ring-slate-300' },
}

const STATUS_DOT = {
  ACTIVE: 'bg-emerald-500',
  SUSPENDED: 'bg-amber-500',
}

const isEmpty = (v) => v == null || v === '—' || v === ''

const sentence = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s)

function CardTag({ label }) {
  const meta = CARD_TAG_META[label] || CARD_TAG_META.PRIVATE
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold tracking-wide ring-1 ${meta.cls}`}
    >
      <Icon name={meta.icon} className="text-[8px]" />
      {sentence(meta.text || label)}
    </span>
  )
}

function MetaCell({ icon, label, value, chip }) {
  const empty = isEmpty(value)
  return (
    <div className="flex flex-col gap-1 px-3 py-3 transition-colors group-hover:bg-white/40">
      <span className="text-[11px] font-bold tracking-[0.08em] text-slate-400">{label}</span>
      {empty ? (
        <span className="text-[15px] font-extrabold tracking-tight text-slate-400">— — —</span>
      ) : chip ? (
        <span className="text-[15px] font-extrabold capitalize tracking-tight text-slate-900">
          {String(value).toLowerCase()}
        </span>
      ) : (
        <span className="flex items-center gap-1.5 truncate text-[15px] font-extrabold tracking-tight text-slate-900">
          {icon && <Icon name={icon} className="text-[11px] text-slate-400" />}
          {value}
        </span>
      )}
    </div>
  )
}

function TenantCard({ tenant, onOpen }) {
  const active = tenant.status === 'ACTIVE'
  return (
    <div
      onClick={onOpen}
      className="group relative w-full cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f7f8fa] text-slate-400 ring-1 ring-inset ring-slate-200 transition-colors duration-200 group-hover:text-slate-500">
          <Icon name="pi-building" className="text-[18px]" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[15px] font-bold tracking-tight text-slate-900">{tenant.name}</span>
          <div className="mt-1 flex items-center gap-2">
            <span className="truncate text-[12.5px] font-medium text-slate-500">{tenant.org}</span>
            <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-500 ring-1 ring-inset ring-slate-200/70">
              {tenant.slug}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold tracking-wide ring-1 ring-inset ring-black/5 ${STATUS_STYLES[tenant.status]}`}
          >
            <span className="relative flex h-1.5 w-1.5">
              {active && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              )}
              <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${STATUS_DOT[tenant.status] || 'bg-slate-400'}`} />
            </span>
            {sentence(tenant.status)}
          </span>
          <TenantMenu />
        </div>
      </div>

      {/* Meta strip */}
      <div className="mt-5 grid grid-cols-3 divide-x divide-slate-200 overflow-hidden rounded-xl border border-slate-200">
        <MetaCell icon="pi-users" label="Users" value={tenant.users} />
        <MetaCell label="Plan" value={tenant.plan} chip />
        <MetaCell label="Region" value={tenant.region} />
      </div>

      {/* Tags */}
      <div className="mt-5 flex flex-wrap items-center gap-1.5">
        {tenant.tags.map((t) => (
          <CardTag key={t.label} label={t.label} />
        ))}
        <span className="ml-auto flex items-center gap-1 text-[12px] font-bold text-blue-600 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 -translate-x-1">
          View details <Icon name="pi-arrow-right" className="text-[11px]" />
        </span>
      </div>
    </div>
  )
}

function TenantTable({ tenants, onOpenTenant }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-[11px] font-bold tracking-[0.08em] text-slate-400">
            <th className="px-5 py-3">Tenant</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3">Users</th>
            <th className="px-5 py-3">Plan</th>
            <th className="px-5 py-3">Region</th>
            <th className="px-5 py-3">Tags</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((t) => {
            const dash = <span className="text-slate-400">—</span>
            return (
              <tr
                key={t.name}
                onClick={() => onOpenTenant(t)}
                className="group cursor-pointer border-b border-slate-100 text-[13px] transition-colors last:border-0 hover:bg-slate-50/60"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f7f8fa] text-slate-400 ring-1 ring-inset ring-slate-200">
                      <Icon name="pi-building" className="text-[15px]" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold tracking-tight text-slate-900">{t.name}</div>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className="text-[12px] font-medium text-slate-500">{t.org}</span>
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-500 ring-1 ring-inset ring-slate-200/70">
                          {t.slug}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold tracking-wide ${STATUS_STYLES[t.status]}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[t.status] || 'bg-slate-400'}`} />
                    {sentence(t.status)}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  {isEmpty(t.users) ? (
                    dash
                  ) : (
                    <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <Icon name="pi-users" className="text-[12px] text-slate-400" />
                      {t.users}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 font-semibold capitalize text-slate-800">
                  {isEmpty(t.plan) ? dash : String(t.plan).toLowerCase()}
                </td>
                <td className="px-5 py-3.5 font-semibold text-slate-800">
                  {isEmpty(t.region) ? dash : t.region}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex flex-wrap gap-1.5">
                    {t.tags.map((tag) => (
                      <CardTag key={tag.label} label={tag.label} />
                    ))}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'SUSPENDED', label: 'Suspended' },
]

function Tenants({ onNavigate, onOpenTenant }) {
  const [view, setView] = useState('cards')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')

  const q = query.trim().toLowerCase()
  const filtered = TENANTS.filter((t) => {
    const matchesQuery =
      !q || [t.name, t.org, t.slug].some((f) => String(f).toLowerCase().includes(q))
    const matchesStatus = status === 'all' || t.status === status
    return matchesQuery && matchesStatus
  })

  const hasFilters = q || status !== 'all'

  const statusCounts = {
    all: TENANTS.length,
    ACTIVE: TENANTS.filter((t) => t.status === 'ACTIVE').length,
    SUSPENDED: TENANTS.filter((t) => t.status === 'SUSPENDED').length,
  }

  return (
    <div className="mx-auto max-w-[1240px] px-7 py-6">
      {/* Title row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-slate-900">Tenants</h1>
          <p className="mt-1 text-[13px] text-slate-500">
            All tenants across every organization
          </p>
        </div>
        <button
          onClick={() => onNavigate('Tenants/New')}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <Icon name="pi-plus" className="text-[12px]" />
          Create Tenant
        </button>
      </div>

      {/* Toolbar */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative w-full max-w-xs">
          <Icon
            name="pi-search"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-slate-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, org, or slug…"
            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-[13px] text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Status filter */}
        <div className="flex h-9 items-center rounded-lg border border-slate-200 bg-slate-50 p-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setStatus(s.key)}
              className={[
                'flex h-full items-center gap-1.5 rounded-md px-3 text-[12px] font-semibold transition-colors',
                status === s.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700',
              ].join(' ')}
            >
              {s.label}
              <span
                className={`rounded px-1.5 text-[11px] font-semibold ${
                  status === s.key ? 'bg-slate-100 text-slate-600' : 'bg-slate-200/70 text-slate-500'
                }`}
              >
                {statusCounts[s.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Cards / Table toggle */}
        <div className="ml-auto flex h-9 items-center rounded-lg border border-slate-200 bg-slate-50 p-1">
          {['cards', 'table'].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={[
                'flex h-full items-center gap-1.5 rounded-md px-3 text-[12px] font-semibold capitalize transition-colors',
                view === v
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700',
              ].join(' ')}
            >
              <Icon name={v === 'cards' ? 'pi-th-large' : 'pi-list'} className="text-[11px]" />
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Result count */}
      <div className="mt-5 text-[13px] font-medium text-slate-500">
        Showing {filtered.length} of {TENANTS.length}{' '}
        {TENANTS.length === 1 ? 'tenant' : 'tenants'}
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="mt-3 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50">
            <Icon name="pi-inbox" className="text-[22px] text-slate-300" />
          </div>
          <p className="mt-3 text-[14px] font-semibold text-slate-600">No tenants found</p>
          <p className="mt-1 text-[12px] text-slate-400">Try adjusting your search or filters.</p>
          {hasFilters && (
            <button
              onClick={() => {
                setQuery('')
                setStatus('all')
              }}
              className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600 hover:bg-slate-50"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : view === 'cards' ? (
        <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {filtered.map((t) => (
            <TenantCard key={t.name} tenant={t} onOpen={() => onOpenTenant(t)} />
          ))}
        </div>
      ) : (
        <div className="mt-3">
          <TenantTable tenants={filtered} onOpenTenant={onOpenTenant} />
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tenant detail                                                      */
/* ------------------------------------------------------------------ */

/* ---- shared primitives ---- */

function InfoRow({ label, children, mono }) {
  return (
    <div className="flex items-start py-2.5">
      <div className="w-40 shrink-0 pt-0.5 text-[11px] font-semibold tracking-[0.04em] text-slate-400">
        {label}
      </div>
      <div className={`text-[13px] text-slate-700 ${mono ? 'font-mono' : ''}`}>
        {children}
      </div>
    </div>
  )
}

function QuickStat({ value, label }) {
  const empty = isEmpty(value)
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white px-4 py-5 transition-shadow hover:shadow-sm">
      <div className={`text-[22px] font-extrabold leading-none ${empty ? 'text-slate-300' : 'text-slate-900'}`}>
        {empty ? '—' : value}
      </div>
      <div className="mt-1.5 text-[11px] font-bold tracking-[0.08em] text-slate-400">
        {label}
      </div>
    </div>
  )
}

const CHIP_STYLES = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
}

function Chip({ children, variant = 'slate' }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[12px] font-semibold tracking-wide ring-1 ${CHIP_STYLES[variant]}`}
    >
      {children}
    </span>
  )
}

function WarningBox({ children }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/70 px-3.5 py-3 text-[13px] text-amber-700">
      <Icon name="pi-exclamation-triangle" className="mt-0.5 text-[14px]" />
      <span>{children}</span>
    </div>
  )
}

function SectionCard({ title, action, children, className = '' }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between px-6 pt-5">
          <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
          {action}
        </div>
      )}
      <div className="px-6 pb-5 pt-4">{children}</div>
    </section>
  )
}

function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative h-6 w-11 rounded-full transition-colors ${on ? 'bg-blue-600' : 'bg-slate-200'}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`}
      />
    </button>
  )
}

/* ---- data-table primitives ---- */

function TableToolbar({ title, action }) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
      {title && <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>}
      <div className="ml-auto flex flex-wrap items-center gap-3">
        <div className="relative w-56 max-w-full">
          <Icon name="pi-search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-slate-400" />
          <input
            placeholder="Search..."
            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-[13px] text-slate-600 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none"
          />
        </div>
        <div className="flex items-center divide-x divide-slate-200 overflow-hidden rounded-lg border border-slate-200">
          <button className="flex h-9 w-9 items-center justify-center text-slate-500 transition-colors hover:bg-slate-50">
            <Icon name="pi-refresh" className="text-[14px]" />
          </button>
          <button className="flex h-9 w-9 items-center justify-center text-slate-500 transition-colors hover:bg-slate-50">
            <Icon name="pi-sliders-h" className="text-[14px]" />
          </button>
          <button className="flex h-9 w-9 items-center justify-center text-slate-500 transition-colors hover:bg-slate-50">
            <Icon name="pi-download" className="text-[14px]" />
          </button>
        </div>
        {action}
      </div>
    </div>
  )
}

function Th({ children, sort, filter, align = 'left' }) {
  return (
    <th className={`px-4 py-3 text-${align} text-[11px] font-semibold tracking-[0.06em] text-slate-400`}>
      <span className={`inline-flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
        {children}
        {sort && <Icon name="pi-sort-alt" className="text-[11px] text-slate-300" />}
        {filter && <Icon name="pi-filter" className="text-[11px] text-slate-300" />}
      </span>
    </th>
  )
}

function TableFooter({ showing }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-[12px] text-slate-400">{showing}</span>
      <div className="flex items-center gap-1.5">
        <button className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-300 hover:bg-slate-50">
          <Icon name="pi-chevron-left" className="text-[11px]" />
        </button>
        <button className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-[12px] font-semibold text-white">
          1
        </button>
        <button className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50">
          <Icon name="pi-chevron-right" className="text-[11px]" />
        </button>
        <button className="ml-1 flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[12px] text-slate-500">
          10 <Icon name="pi-chevron-down" className="text-[11px]" />
        </button>
      </div>
    </div>
  )
}

function RowMenuButton() {
  return (
    <button className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50">
      <Icon name="pi-ellipsis-v" className="text-[12px]" />
    </button>
  )
}

/* ---- tab demo data ---- */

const TENANT_USERS = [
  {
    name: 'Sarah sarah',
    email: 'sarah@sarah.com',
    roles: ['4E96D1F7...', '9F26CED9...', 'E636FCA2...', '13253514...'],
    status: 'ACTIVE',
  },
]

const TENANT_ROLES = [
  { role: 'TENANT_ADMIN', perms: 45 },
  { role: 'TENANT_USER', perms: 26 },
  { role: 'COMP_ADMIN', perms: 23 },
  { role: 'COMPLIANCE_OFFICER', perms: 13 },
  { role: 'FINANCE_MANAGER', perms: 15 },
  { role: 'EXECUTIVE', perms: 12 },
  { role: 'COMP_OPERATOR', perms: 15 },
  { role: 'COMP_PRODUCER', perms: 1 },
]

const TENANT_JOBS = [
  { name: 'batch-processor-worker', group: 'batch', type: 'FIXED_RATE', schedule: 'every 10000ms', mode: 'BOTH' },
  { name: 'bulk-import-driver', group: 'party-bulk-import', type: 'CRON', schedule: '0/30 * * * * ?', mode: 'BOTH' },
  { name: 'catalog-promotion-stale-sweep', group: 'product', type: 'CRON', schedule: '0 30 6 * ?', mode: 'LIVE' },
  { name: 'distribution-advisory-producer-retention-risk', group: 'distribution-advisory', type: 'CRON', schedule: '0 0 0 1 1 ? 2099', mode: 'BOTH' },
  { name: 'event-outbox-drain', group: 'party-projections', type: 'CRON', schedule: '0/15 * * * * ?', mode: 'BOTH' },
  { name: 'party-advisory-expiry-sweep', group: 'party-data-lifecycle', type: 'CRON', schedule: '0 0 3 * ?', mode: 'BOTH', status: 'SUCCESS', lastRun: '29/06/2026, 08:30:00', duration: '580ms' },
  { name: 'party-batch-rescan-auto-enqueue', group: 'party-mdm', type: 'CRON', schedule: '0 0 1 * ?', mode: 'BOTH' },
  { name: 'party-batch-rescan-worker', group: 'party-mdm', type: 'CRON', schedule: '0 0 2 * ?', mode: 'BOTH' },
  { name: 'party-consent-expiry-sweep', group: 'party-data-lifecycle', type: 'CRON', schedule: '0 15 2 * ?', mode: 'BOTH', status: 'SUCCESS', lastRun: '29/06/2026, 07:45:00', duration: '331ms' },
]

const CHART_HOURS = [
  '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00',
  '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00',
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00',
]

/* ---- tab: Overview ---- */

function OverviewTab({ tenant }) {
  const { layout } = useContext(ThemeContext)
  const isSplit = layout === 3
  const d = tenant.detail
  const fields = [
    { label: 'Tenant ID', value: d.id, mono: true },
    { label: 'Display name', value: d.displayName },
    { label: 'Organization', value: tenant.org },
    { label: 'Support email', value: d.contactEmail },
    { label: 'Region', value: d.region },
    { label: 'Plan', value: sentence(d.plan) },
  ]
  const editBtn = (
    <button className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-blue-700">
      <Icon name="pi-pencil" className="text-[12px]" />
      Edit Details
    </button>
  )
  return (
    <div className={isSplit ? '' : 'mt-5'}>
      {isSplit && (
        <div className="flex items-center justify-between pt-5">
          <h2 className="text-[15px] font-semibold text-slate-900">Overview</h2>
          {editBtn}
        </div>
      )}
      <div
        className={`grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3 ${isSplit ? 'mt-5' : ''}`}
      >
        {fields.map((f) => (
          <div key={f.label} className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-400">
              {f.label}
            </div>
            {f.mono ? (
              <span className="mt-1.5 inline-flex max-w-full truncate rounded-md bg-slate-100 px-2 py-1 font-mono text-[13px] text-slate-700">
                {f.value}
              </span>
            ) : (
              <div className="mt-1.5 truncate text-[15px] font-semibold text-slate-900">{f.value}</div>
            )}
          </div>
        ))}
      </div>

      {!isSplit && (
        <div className="mt-6 flex items-center justify-end border-t border-slate-100 pt-4">{editBtn}</div>
      )}
    </div>
  )
}

/* ---- tab: Branding ---- */

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function AssetUpload({ label, maxMB = 1, rounded, onChange }) {
  const [status, setStatus] = useState('empty') // empty | uploading | done | error
  const [asset, setAsset] = useState(null) // { url, name, size }
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  const pick = () => inputRef.current?.click()

  const handleFile = (file) => {
    if (!file) return
    setError('')
    if (!/image\/(png|svg\+xml)/.test(file.type)) {
      setStatus('error')
      setError('Only PNG or SVG files are allowed.')
      return
    }
    if (file.size > maxMB * 1024 * 1024) {
      setStatus('error')
      setError(`File exceeds the ${maxMB}MB limit.`)
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result
      setStatus('uploading')
      setProgress(0)
      let p = 0
      const timer = setInterval(() => {
        p += 20
        setProgress(Math.min(p, 100))
        if (p >= 100) {
          clearInterval(timer)
          const next = { url, name: file.name, size: file.size }
          setAsset(next)
          setStatus('done')
          onChange?.(next)
        }
      }, 110)
    }
    reader.onerror = () => {
      setStatus('error')
      setError('Failed to read the file.')
    }
    reader.readAsDataURL(file)
  }

  const onInput = (e) => {
    handleFile(e.target.files?.[0])
    e.target.value = ''
  }

  const remove = () => {
    setAsset(null)
    setStatus('empty')
    setProgress(0)
    setError('')
    onChange?.(null)
  }

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/svg+xml"
        className="hidden"
        onChange={onInput}
      />

      {status === 'empty' || status === 'error' ? (
        <div
          onClick={pick}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            handleFile(e.dataTransfer.files?.[0])
          }}
          className={`mt-2 flex h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-center transition-colors ${
            status === 'error'
              ? 'border-red-300 bg-red-50/50'
              : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/40'
          }`}
        >
          <Icon name="pi-cloud-upload" className="text-[20px] text-slate-400" />
          <div className="text-[13px] font-semibold text-slate-600">Click to upload</div>
          <div className="text-[11px] text-slate-400">PNG or SVG · max {maxMB}MB</div>
          {status === 'error' && (
            <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-red-500">
              <Icon name="pi-exclamation-circle" className="text-[11px]" />
              {error}
            </div>
          )}
        </div>
      ) : status === 'uploading' ? (
        <div className="mt-2 flex h-28 flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-6">
          <div className="flex items-center gap-2 text-[13px] font-medium text-slate-600">
            <Icon name="pi-spinner" className="pi-spin text-[13px] text-blue-600" />
            Uploading…
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-slate-50 ${
              rounded ? 'rounded-full' : 'rounded-lg'
            }`}
          >
            <img src={asset.url} alt={asset.name} className="h-full w-full object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <Icon name="pi-check-circle" className="text-[12px] text-emerald-500" />
              <span className="truncate text-[13px] font-semibold text-slate-800">{asset.name}</span>
            </div>
            <div className="mt-0.5 text-[11px] text-slate-400">{formatBytes(asset.size)}</div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={pick}
              title="Replace"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-blue-50 hover:text-slate-800"
            >
              <Icon name="pi-pencil" className="text-[12px]" />
            </button>
            <button
              type="button"
              onClick={remove}
              title="Delete"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <Icon name="pi-trash" className="text-[12px]" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function BrandColorField({ label, swatchClass, value }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="mt-2 flex items-center gap-2">
        <span className={`h-9 w-9 shrink-0 rounded-md ${swatchClass}`} />
        <input
          defaultValue={value}
          className="h-9 w-full min-w-0 flex-1 rounded-lg border border-slate-200 px-3 font-mono text-[13px] text-slate-700 focus:border-blue-400 focus:outline-none"
        />
      </div>
    </div>
  )
}

function BrandingTab({ tenant }) {
  const [assets, setAssets] = useState({ logoLight: null, logoDark: null, favicon: null })
  const set = (key) => (val) => setAssets((a) => ({ ...a, [key]: val }))

  const PRIMARY = '#1D4ED8'
  const ACCENT = '#10B981'
  const initials = tenant.initials.padEnd(2, 'E').slice(0, 2).toUpperCase()
  const displayName = tenant.name.charAt(0).toUpperCase() + tenant.name.slice(1)

  return (
    <div className="mt-5 grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
      <SectionCard
        title="Brand Assets"
        action={
          <button className="rounded-lg bg-blue-600 px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-blue-700">
            Save
          </button>
        }
      >
        <div className="space-y-5">
          <AssetUpload label="Logo (light theme)" onChange={set('logoLight')} />
          <AssetUpload label="Logo (dark theme)" onChange={set('logoDark')} />
          <AssetUpload label="Favicon" rounded onChange={set('favicon')} />
          <div className="grid grid-cols-2 gap-3">
            <BrandColorField label="Primary color" swatchClass="bg-[#1D4ED8]" value="#1D4ED8" />
            <BrandColorField label="Accent color" swatchClass="bg-[#10B981]" value="#10B981" />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-slate-900">Custom Domain</h3>
            <input
              placeholder="app.example.com"
              className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-[13px] text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none"
            />
            <p className="mt-1.5 text-[12px] text-slate-400">CNAME → nexus.ensylon.com</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Live Preview">
        <div className="space-y-4">
          {/* Light theme header — reflects light logo */}
          <div>
            <div className="mb-1.5 text-[11px] font-bold tracking-[0.06em] text-slate-400">
              Light theme
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                {assets.logoLight ? (
                  <img src={assets.logoLight.url} alt="logo" className="h-9 max-w-[150px] object-contain" />
                ) : (
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-[12px] font-bold text-white"
                    style={{ backgroundColor: PRIMARY }}
                  >
                    {initials}
                  </div>
                )}
                <span className="text-[15px] font-bold text-slate-900">{displayName}</span>
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  className="rounded-lg px-3.5 py-2 text-[12px] font-semibold text-white"
                  style={{ backgroundColor: PRIMARY }}
                >
                  Primary Action
                </button>
                <button
                  className="rounded-lg px-3.5 py-2 text-[12px] font-semibold text-white"
                  style={{ backgroundColor: ACCENT }}
                >
                  Accent
                </button>
              </div>
            </div>
          </div>

          {/* Dark theme header — reflects dark logo */}
          <div>
            <div className="mb-1.5 text-[11px] font-bold tracking-[0.06em] text-slate-400">
              Dark theme
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-center gap-3">
                {assets.logoDark ? (
                  <img src={assets.logoDark.url} alt="logo dark" className="h-9 max-w-[150px] object-contain" />
                ) : (
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-[12px] font-bold text-white"
                    style={{ backgroundColor: PRIMARY }}
                  >
                    {initials}
                  </div>
                )}
                <span className="text-[15px] font-bold text-white">{displayName}</span>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

/* ---- tab: Database ---- */

function DatabaseTab({ tenant }) {
  const d = tenant.detail
  return (
    <div className="mt-5 grid grid-cols-2 items-start gap-4">
      <SectionCard title="Dedicated Live Database">
        <div className="divide-y divide-slate-50">
          <InfoRow label="Status"><Chip variant="green">Healthy</Chip></InfoRow>
          <InfoRow label="Isolation"><Chip variant="blue">{d.isolationLabel}</Chip></InfoRow>
          <InfoRow label="Last migration"><span className="text-slate-400">—</span></InfoRow>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-blue-700">
            <Icon name="pi-play" className="text-[12px]" />
            Trigger Migration
          </button>
          <button className="rounded-lg border border-slate-200 px-3.5 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50">
            Pool Diagnostics
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Sandbox Database">
        <p className="text-[13px] text-slate-400">Not provisioned for this tenant.</p>
      </SectionCard>
    </div>
  )
}

/* ---- tab: Users ---- */

function UsersTab() {
  return (
    <div className="mt-5">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <TableToolbar
          title="Users"
          action={
            <button className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-blue-700">
              <Icon name="pi-plus" className="text-[12px]" />
              Invite User
            </button>
          }
        />
        <table className="w-full">
          <thead>
            <tr className="border-y border-slate-100 bg-slate-50/60">
              <Th sort filter>Name</Th>
              <Th sort filter>Email</Th>
              <Th>Role</Th>
              <Th sort filter>Status</Th>
              <Th sort>Last login</Th>
              <Th>MFA</Th>
              <th />
            </tr>
          </thead>
          <tbody>
            {TENANT_USERS.map((u) => (
              <tr key={u.email} className="border-b border-slate-50 text-[13px]">
                <td className="px-4 py-4 font-semibold text-blue-600">{u.name}</td>
                <td className="px-4 py-4 text-slate-600">{u.email}</td>
                <td className="px-4 py-4">
                  <div className="grid w-max grid-cols-2 gap-1">
                    {u.roles.map((r) => (
                      <Chip key={r}>{r}</Chip>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-4"><Chip variant="green">{u.status}</Chip></td>
                <td className="px-4 py-4 text-slate-400">—</td>
                <td className="px-4 py-4 text-slate-400">—</td>
                <td className="px-4 py-4 text-right"><RowMenuButton /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-slate-100">
          <TableFooter showing={`Showing 1–${TENANT_USERS.length} of ${TENANT_USERS.length}`} />
        </div>
      </div>
    </div>
  )
}

/* ---- tab: Roles & Permissions ---- */

function RolesTab() {
  return (
    <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
      <TableToolbar
        title="Tenant roles"
        action={
          <button className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-blue-700">
            <Icon name="pi-plus" className="text-[12px]" />
            New Role
          </button>
        }
      />
      <table className="w-full">
        <thead>
          <tr className="border-y border-slate-100 bg-slate-50/60">
            <Th>Role</Th>
            <Th>Type</Th>
            <Th>Status</Th>
            <Th align="right">Perms</Th>
            <Th align="right">Members</Th>
            <th />
          </tr>
        </thead>
        <tbody>
          {TENANT_ROLES.map((r) => (
            <tr key={r.role} className="border-b border-slate-50 text-[13px] last:border-0">
              <td className="px-4 py-3.5 font-semibold text-slate-800">{r.role}</td>
              <td className="px-4 py-3.5 text-slate-400">Built-in</td>
              <td className="px-4 py-3.5"><Chip variant="green">Active</Chip></td>
              <td className="px-4 py-3.5 text-right text-slate-600">{r.perms}</td>
              <td className="px-4 py-3.5 text-right text-slate-600">0</td>
              <td className="px-4 py-3.5 text-right"><RowMenuButton /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ---- tab: empty data table (API Keys / Webhooks) ---- */

function EmptyDataTab({ title, action, columns, emptyText }) {
  return (
    <div className="mt-5">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <TableToolbar title={title} action={action} />
        <table className="w-full">
          <thead>
            <tr className="border-y border-slate-100 bg-slate-50/60">
              {columns.map((c) => (
                <Th key={c.label} sort={c.sort} filter={c.filter}>
                  {c.label}
                </Th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-[13px] text-slate-500">
                {emptyText}
              </td>
            </tr>
          </tbody>
        </table>
        <div className="border-t border-slate-100">
          <TableFooter showing="Showing 0–0 of 0" />
        </div>
      </div>
    </div>
  )
}

/* ---- tab: Jobs ---- */

function JobsTab() {
  return (
    <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
      <TableToolbar title="Jobs" />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px]">
          <thead>
            <tr className="border-y border-slate-100 bg-slate-50/60">
              <Th sort filter>Name</Th>
              <Th sort filter>Group</Th>
              <Th sort filter>Type</Th>
              <Th>Schedule</Th>
              <Th sort filter>Timezone</Th>
              <Th sort filter>Mode</Th>
              <Th sort filter>Last status</Th>
              <Th sort>Last run</Th>
              <Th>Duration</Th>
              <Th>Items</Th>
              <Th>Error</Th>
            </tr>
          </thead>
          <tbody>
            {TENANT_JOBS.map((j) => (
              <tr key={j.name} className="border-b border-slate-50 align-top text-[12px]">
                <td className="px-4 py-3.5 text-slate-700">{j.name}</td>
                <td className="px-4 py-3.5 text-slate-500">{j.group}</td>
                <td className="px-4 py-3.5">
                  <Chip variant={j.type === 'CRON' ? 'blue' : 'slate'}>{j.type}</Chip>
                </td>
                <td className="px-4 py-3.5 font-mono text-slate-600">{j.schedule}</td>
                <td className="px-4 py-3.5 text-slate-500">America/New_York</td>
                <td className="px-4 py-3.5">
                  <Chip variant={j.mode === 'LIVE' ? 'green' : 'amber'}>{j.mode}</Chip>
                </td>
                <td className="px-4 py-3.5">
                  {j.status === 'SUCCESS' ? (
                    <Chip variant="green">Success</Chip>
                  ) : (
                    <span className="text-slate-400">never run</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-slate-500">{j.lastRun ?? '—'}</td>
                <td className="px-4 py-3.5 text-slate-500">{j.duration ?? '—'}</td>
                <td className="px-4 py-3.5 text-slate-400">—</td>
                <td className="px-4 py-3.5 text-slate-400">—</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ---- tab: Live ---- */

function LiveTab({ tenant }) {
  const d = tenant.detail
  return (
    <div className="mt-5 grid grid-cols-2 items-start gap-4">
      <SectionCard title="Live Status">
        <div className="divide-y divide-slate-50">
          <InfoRow label="Environment"><Chip variant="green">Live</Chip></InfoRow>
          <InfoRow label="Mode access"><Chip variant="slate">Inactive</Chip></InfoRow>
          <InfoRow label="Isolation"><Chip variant="blue">{d.isolationLabel}</Chip></InfoRow>
          <InfoRow label="Region" mono>{d.region}</InfoRow>
        </div>
        <button className="mt-4 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-blue-700">
          <Icon name="pi-bolt" className="text-[12px]" />
          Enable Live
        </button>
      </SectionCard>

      <SectionCard title="Live Database">
        <WarningBox>
          Live is the production environment serving real users. Mode changes take effect
          immediately.
        </WarningBox>
        <p className="mt-4 text-[13px] text-slate-400">Not provisioned for this tenant.</p>
      </SectionCard>
    </div>
  )
}

/* ---- tab: Sandbox ---- */

function SandboxTab() {
  return (
    <div className="mt-5 grid grid-cols-2 items-start gap-4">
      <SectionCard title="Sandbox Status">
        <div className="divide-y divide-slate-50">
          <InfoRow label="Environment"><Chip variant="blue">Sandbox</Chip></InfoRow>
          <InfoRow label="Last reset"><span className="text-slate-400">—</span></InfoRow>
          <InfoRow label="Seed status"><Chip variant="green">Seeded</Chip></InfoRow>
          <InfoRow label="Resets this month">0 of 10</InfoRow>
        </div>
        <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100" />
        <p className="mt-2 text-[12px] text-slate-400">0 of 10 monthly resets used</p>
        <button className="mt-4 flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-red-700">
          <Icon name="pi-refresh" className="text-[12px]" />
          Reset Sandbox
        </button>
      </SectionCard>

      <SectionCard title=" ">
        <WarningBox>
          This sandbox shares infrastructure with other tenants. Reset clears only this
          tenant’s data.
        </WarningBox>
        <div className="mt-3 divide-y divide-slate-50">
          <InfoRow label="Reset cooldown">Resets monthly</InfoRow>
          <InfoRow label="Available at">
            <span className="inline-flex items-center gap-1 text-emerald-600">
              Now <Icon name="pi-check" className="text-[11px]" />
            </span>
          </InfoRow>
        </div>
      </SectionCard>
    </div>
  )
}

/* ---- tab: Privacy ---- */

function MetricCard({ topColor, label, value, valueColor = 'text-slate-900', sub }) {
  return (
    <div className={`rounded-xl border border-slate-200 border-t-2 ${topColor} bg-white px-5 py-4`}>
      <div className="text-[11px] font-semibold tracking-[0.06em] text-slate-400">{label}</div>
      <div className={`mt-2 font-mono text-[24px] font-bold leading-none ${valueColor}`}>
        {value}
      </div>
      {sub && <div className="mt-2 text-[12px] text-slate-400">{sub}</div>}
    </div>
  )
}

function PrivacyTab() {
  return (
    <div className="mt-5 space-y-5">
      <div className="grid grid-cols-3 gap-5">
        <MetricCard
          topColor="border-t-emerald-500"
          label="Active consents"
          value="0"
          valueColor="text-emerald-600"
          sub="No upcoming expirations"
        />
        <MetricCard topColor="border-t-slate-700" label="Erasure requests" value="0" />
        <MetricCard
          topColor="border-t-blue-500"
          label="Data exports"
          value="0"
          valueColor="text-blue-600"
          sub="No open requests"
        />
      </div>
      <div className="grid grid-cols-2 gap-5">
        <SectionCard title="Erasure Requests">
          <p className="text-[13px] text-slate-400">No open erasure requests.</p>
        </SectionCard>
        <SectionCard title="Privacy Policy Status">
          <div className="text-[11px] font-semibold tracking-[0.06em] text-slate-400">
            ACTIVE POLICY
          </div>
        </SectionCard>
      </div>
    </div>
  )
}

/* ---- tab: Observability ---- */

function MiniChart({ title, color }) {
  return (
    <SectionCard title={title}>
      <div className="relative h-56">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute left-0 right-0 border-t border-dashed border-slate-100"
            style={{ top: `${i * 25 + 8}%` }}
          />
        ))}
        <div className="absolute bottom-8 left-0 right-0 flex items-end justify-between">
          {CHART_HOURS.map((h, i) => (
            <div key={h + i} className="flex flex-col items-center">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-sm text-[11px] font-semibold text-white ${color}`}
              >
                0
              </span>
            </div>
          ))}
        </div>
        <div className="absolute bottom-0 left-0 right-0 flex items-start justify-between">
          {CHART_HOURS.map((h, i) => (
            <span
              key={h + i}
              className="origin-top-left -rotate-45 text-[8px] text-slate-400"
            >
              {h}
            </span>
          ))}
        </div>
      </div>
    </SectionCard>
  )
}

function ObservabilityTab() {
  return (
    <div className="mt-5 space-y-5">
      <div className="grid grid-cols-4 gap-5">
        <MetricCard
          topColor="border-t-blue-500"
          label="Requests (1h)"
          value="0"
          valueColor="text-blue-600"
          sub="p50: 0ms · p95: 0ms"
        />
        <MetricCard
          topColor="border-t-emerald-500"
          label="Error rate"
          value="0.00%"
          valueColor="text-emerald-600"
          sub="0 errors in last 1h"
        />
        <MetricCard topColor="border-t-slate-700" label="CPU usage" value="—" sub="Avg across workers" />
        <MetricCard topColor="border-t-blue-500" label="Storage used" value="—" />
      </div>
      <div className="grid grid-cols-2 gap-5">
        <MiniChart title="Request Volume (24h)" color="bg-blue-500" />
        <MiniChart title="Error Rate (24h)" color="bg-emerald-500" />
      </div>
    </div>
  )
}

/* ---- tab: Audit Trail ---- */

function AuditTab({ tenant }) {
  return (
    <div className="mt-5">
      <SectionCard
        title={`Audit Trail — ${tenant.name}`}
        action={
          <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50">
            <Icon name="pi-download" className="text-[12px] text-slate-500" />
            Export
          </button>
        }
      >
        <p className="text-[13px] text-slate-400">No audit events recorded.</p>
      </SectionCard>
    </div>
  )
}

/* ---- tab: Settings ---- */

function SettingsTab() {
  const [mfa, setMfa] = useState(false)
  return (
    <div className="mt-5">
      <SectionCard
        title="General Settings"
        action={
          <button className="cursor-default rounded-lg bg-blue-400 px-4 py-1.5 text-[12px] font-semibold text-white">
            Save Changes
          </button>
        }
      >
        <h3 className="text-[14px] font-semibold text-slate-900">Require MFA</h3>
        <div className="mt-2">
          <Toggle on={mfa} onChange={() => setMfa((v) => !v)} />
        </div>
        <p className="mt-2 text-[13px] text-slate-500">
          When on, MFA is required for all users in this tenant.
        </p>
      </SectionCard>
    </div>
  )
}

/* ---- tab: SSO Configuration ---- */

function SkeletonBars({ widths }) {
  return (
    <div className="space-y-3">
      {widths.map((w, i) => (
        <div key={i} className="h-3 rounded bg-slate-100" style={{ width: w }} />
      ))}
    </div>
  )
}

function SsoTab() {
  return (
    <div className="mt-5 grid grid-cols-2 items-start gap-4">
      <SectionCard title="SSO Configuration">
        <SkeletonBars widths={['100%', '100%', '100%', '100%', '100%', '60%']} />
      </SectionCard>
      <SectionCard title="SSO Status">
        <SkeletonBars widths={['100%', '100%', '100%', '70%']} />
      </SectionCard>
    </div>
  )
}

/* ---- container ---- */

function TenantDetail({ tenant, onNavigate }) {
  const d = tenant.detail
  const active = tenant.status === 'ACTIVE'
  const TABS = [
    { key: 'overview', label: 'Overview', icon: 'pi-th-large', desc: 'General tenant configuration', status: 'Complete', summary: '6 fields configured' },
    { key: 'branding', label: 'Branding', icon: 'pi-palette', desc: 'Logo, favicon, and visual identity', status: 'Complete', summary: 'Logo · Favicon uploaded' },
    { key: 'database', label: 'Database', icon: 'pi-database', desc: 'Database configuration and connections', status: 'Healthy', summary: 'Connected' },
    { key: 'users', label: `Users (${d.stats.activeUsers})`, icon: 'pi-users', desc: 'Manage tenant users and invitations', status: 'Active', summary: `${d.stats.activeUsers} member${d.stats.activeUsers === 1 ? '' : 's'}` },
    { key: 'roles', label: 'Roles & Permissions', icon: 'pi-shield', desc: 'Manage roles and access permissions', status: 'Complete', summary: 'Roles configured' },
    { key: 'apikeys', label: `API Keys (${d.stats.apiKeys})`, icon: 'pi-key', desc: 'Manage API keys and integrations', status: 'Empty', tone: 'muted', summary: `${d.stats.apiKeys} keys` },
    { key: 'webhooks', label: 'Webhooks', icon: 'pi-send', desc: 'Configure webhook endpoints and events', status: 'Empty', tone: 'muted', summary: '0 endpoints' },
    { key: 'jobs', label: 'Jobs', icon: 'pi-clock', desc: 'View background jobs and execution history', status: 'Active', summary: 'Scheduled' },
    { key: 'live', label: 'Live', icon: 'pi-circle-fill', desc: 'Live environment settings and status', status: 'Active', summary: 'Live' },
    { key: 'sandbox', label: 'Sandbox', icon: 'pi-box', desc: 'Sandbox environment and data reset', status: 'Ready', summary: 'Idle' },
    { key: 'privacy', label: 'Privacy', icon: 'pi-lock', desc: 'Privacy, consent, and data controls', status: 'Complete', summary: 'Configured' },
    { key: 'observability', label: 'Observability', icon: 'pi-chart-line', desc: 'Metrics, logs, and monitoring', status: 'Healthy', summary: 'Monitoring' },
    { key: 'audit', label: 'Audit Trail', icon: 'pi-list', desc: 'Security and activity audit log', status: 'Active', summary: 'Logging' },
    { key: 'settings', label: 'Settings', icon: 'pi-cog', desc: 'General tenant settings', status: 'Complete', summary: 'Configured' },
    { key: 'sso', label: 'SSO Configuration', icon: 'pi-id-card', desc: 'Single sign-on configuration', status: 'Not set', tone: 'muted', summary: 'Disabled' },
  ]
  const { layout } = useContext(ThemeContext)
  const alt = layout === 2
  const [openKeys, setOpenKeys] = useState(() => new Set(['overview']))
  const [navOpen, setNavOpen] = useState(false)
  const [selected, setSelected] = useState('overview')
  const [quickNavOpen, setQuickNavOpen] = useState(false)
  const sectionRefs = useRef({})
  const tabScrollRef = useRef(null)
  const scrollTabs = (dir) =>
    tabScrollRef.current?.scrollBy({ left: dir * 220, behavior: 'smooth' })

  const isOpen = (k) => openKeys.has(k)
  const toggleKey = (k) =>
    setOpenKeys((prev) => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })
  const allOpen = openKeys.size === TABS.length
  const toggleAll = () =>
    setOpenKeys(allOpen ? new Set() : new Set(TABS.map((t) => t.key)))
  const goTo = (k) => {
    setOpenKeys((prev) => new Set(prev).add(k))
    setNavOpen(false)
    setTimeout(() => {
      sectionRefs.current[k]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 60)
  }

  const renderSection = (key) => {
    switch (key) {
      case 'overview':
        return <OverviewTab tenant={tenant} />
      case 'branding':
        return <BrandingTab tenant={tenant} />
      case 'database':
        return <DatabaseTab tenant={tenant} />
      case 'users':
        return <UsersTab />
      case 'roles':
        return <RolesTab />
      case 'apikeys':
        return (
          <EmptyDataTab
            title="API keys"
            action={
              <button className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-blue-700">
                <Icon name="pi-plus" className="text-[12px]" />
                Create API Key
              </button>
            }
            emptyText="No data available"
            columns={[
              { label: 'Name', sort: true, filter: true },
              { label: 'Prefix' },
              { label: 'Env', filter: true },
              { label: 'Created by' },
              { label: 'Created', sort: true },
              { label: 'Last used', sort: true },
              { label: 'Status', filter: true },
            ]}
          />
        )
      case 'webhooks':
        return (
          <EmptyDataTab
            title="Webhooks"
            action={
              <button className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-blue-700">
                <Icon name="pi-plus" className="text-[12px]" />
                Register
              </button>
            }
            emptyText="No data available"
            columns={[
              { label: 'URL', sort: true, filter: true },
              { label: 'Events' },
              { label: 'Status', sort: true, filter: true },
              { label: 'Last delivery', sort: true, filter: true },
            ]}
          />
        )
      case 'jobs':
        return <JobsTab />
      case 'live':
        return <LiveTab tenant={tenant} />
      case 'sandbox':
        return <SandboxTab />
      case 'privacy':
        return <PrivacyTab />
      case 'observability':
        return <ObservabilityTab />
      case 'audit':
        return <AuditTab tenant={tenant} />
      case 'settings':
        return <SettingsTab />
      case 'sso':
        return <SsoTab />
      default:
        return null
    }
  }

  /* ---- Shared top card for layouts 2 & 3 ---- */
  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  const dp = (d.created || '').split(' ')[0].split('/') // [MM, DD, YYYY]
  const mIdx = dp.length === 3 ? Number(dp[0]) - 1 : -1
  const sinceLong = mIdx >= 0 ? `${MONTHS[mIdx]} ${dp[2]}` : d.created
  const metaChips = [
    { icon: 'pi-map-marker', label: 'Region', value: d.region },
    { icon: 'pi-box', label: 'Plan', value: sentence(d.plan) },
    { icon: 'pi-users', label: 'Users', value: String(d.stats.activeUsers) },
    { icon: 'pi-hashtag', label: 'Slug', value: d.slug, mono: true },
  ]
  const topCard = (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Identity row */}
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <Icon name="pi-building" className="text-[20px]" />
          </div>
          {active && (
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white">
              <Icon name="pi-check" className="text-[9px] text-white" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[22px] font-bold tracking-tight text-slate-900">{tenant.name}</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[12px] font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {sentence(tenant.status)}
            </span>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[12px] font-semibold text-blue-700">
              {sentence(d.isolationLabel)}
            </span>
          </div>
          <div className="mt-1 text-[14px] text-slate-500">
            {tenant.org} · Tenant since {sinceLong}
          </div>
        </div>
        <TenantMenu />
      </div>

      {/* Meta chips */}
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {metaChips.map((c) => (
          <div key={c.label} className="flex items-center gap-2 rounded-xl bg-slate-100 px-3.5 py-2.5">
            <Icon name={c.icon} className="shrink-0 text-[14px] text-slate-400" />
            <span className="text-[13px] text-slate-500">{c.label}</span>
            <span className={`truncate text-[13px] font-bold text-slate-900 ${c.mono ? 'font-mono' : ''}`}>
              {c.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )

  /* ---- Layout 4 (horizontal scrollable tabs + quick navigate) ---- */
  if (layout === 4) {
    return (
      <div className="mx-auto max-w-[1240px] px-7 py-6">
        <Breadcrumb trail={['Tenants', tenant.name]} onNavigate={onNavigate} />

        {/* Top card */}
        <div className="mt-5">{topCard}</div>

        {/* Horizontal tab bar */}
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollTabs(-1)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50"
            aria-label="Scroll tabs left"
          >
            <Icon name="pi-chevron-left" className="text-[12px]" />
          </button>

          <div ref={tabScrollRef} className="no-scrollbar flex-1 overflow-x-auto">
            <div className="flex min-w-max items-center gap-1 border-b border-slate-200">
              {TABS.map((t) => {
                const on = t.key === selected
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setSelected(t.key)}
                    className={`flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-[13px] font-semibold transition-colors ${
                      on
                        ? 'border-indigo-600 text-indigo-700'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Icon name={t.icon} className={`text-[13px] ${on ? 'text-indigo-600' : 'text-slate-400'}`} />
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => scrollTabs(1)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50"
            aria-label="Scroll tabs right"
          >
            <Icon name="pi-chevron-right" className="text-[12px]" />
          </button>

          {/* Quick navigate */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setQuickNavOpen((o) => !o)
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                quickNavOpen ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon name="pi-compass" className="text-[13px]" />
              Quick navigate
              <Icon name="pi-chevron-down" className="text-[10px]" />
            </button>
            {quickNavOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setQuickNavOpen(false)} />
                <div className="absolute right-0 z-40 mt-1.5 max-h-80 w-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                  {TABS.map((t) => {
                    const on = t.key === selected
                    return (
                      <button
                        key={t.key}
                        onClick={() => {
                          setSelected(t.key)
                          setQuickNavOpen(false)
                        }}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12.5px] transition-colors ${
                          on ? 'bg-indigo-50 font-semibold text-indigo-700' : 'font-medium text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon name={t.icon} className={`text-[13px] ${on ? 'text-indigo-600' : 'text-slate-400'}`} />
                        {t.label}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div
          className={`mt-4 min-w-0 ${
            selected === 'overview'
              ? 'rounded-2xl border border-slate-200 bg-white px-5 pb-5'
              : '[&>*]:!mt-0'
          }`}
        >
          {renderSection(selected)}
        </div>
      </div>
    )
  }

  /* ---- Layout 3 (split: left rail + right content) ---- */
  if (layout === 3) {
    return (
      <div className="mx-auto max-w-[1240px] px-7 py-6">
        <Breadcrumb trail={['Tenants', tenant.name]} onNavigate={onNavigate} />

        {/* Top card (non-sticky in layout 3) */}
        <div className="mt-5">{topCard}</div>

        {/* Split body */}
        <div className="mt-4 flex items-start gap-4">
          <aside className="w-max shrink-0">
            <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-2">
              {TABS.map((t) => {
                const on = t.key === selected
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setSelected(t.key)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13px] transition-colors ${
                      on ? 'bg-indigo-50 font-semibold text-indigo-700' : 'font-medium text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon name={t.icon} className={`text-[14px] ${on ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="whitespace-nowrap">{t.label}</span>
                  </button>
                )
              })}
            </div>
          </aside>

          <div
            className={`min-w-0 flex-1 ${
              selected === 'overview'
                ? 'rounded-2xl border border-slate-200 bg-white px-5 pb-5'
                : '[&>*]:!mt-0'
            }`}
          >
            {renderSection(selected)}
          </div>
        </div>
      </div>
    )
  }

  /* ---- Layout 2 (card accordions) ---- */
  if (layout === 2) {
    return (
      <div className="mx-auto max-w-[1240px] px-7 py-6">
        <Breadcrumb trail={['Tenants', tenant.name]} onNavigate={onNavigate} />

        {/* Sticky: top card + section controls */}
        <div className="sticky top-0 z-20 -mx-7 bg-white px-7 pb-4 pt-5">
        {topCard}

        {/* Labeled separator + section controls */}
        <div className="mt-6 flex items-center gap-4">
          <span className="shrink-0 text-[13px] font-bold uppercase tracking-[0.12em] text-slate-500">
            Feature modules
          </span>
          <span className="h-px flex-1 bg-slate-200" />
          <div className="flex shrink-0 items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setNavOpen((o) => !o)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                <Icon name="pi-list" className="text-[13px] text-slate-500" />
                Quick links
              </button>
              {navOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setNavOpen(false)} />
                  <div className="absolute right-0 z-20 mt-1.5 max-h-[60vh] w-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                    {TABS.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => goTo(t.key)}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        <Icon name={t.icon} className="text-[12px] text-slate-400" />
                        <span className="truncate">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={toggleAll}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Icon
                name={allOpen ? 'pi-angle-double-up' : 'pi-angle-double-down'}
                className="text-[13px] text-slate-500"
              />
              {allOpen ? 'Collapse All' : 'Expand All'}
            </button>
          </div>
        </div>
        </div>

        {/* Body: section cards */}
        <div className="mt-5 space-y-4">
            {TABS.map((t) => {
              const open = isOpen(t.key)
              return (
                <div
                  key={t.key}
                  ref={(el) => (sectionRefs.current[t.key] = el)}
                  className="scroll-mt-[260px] overflow-hidden rounded-2xl border border-slate-200 bg-white"
                >
                  <button
                    type="button"
                    onClick={() => toggleKey(t.key)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-3 p-5 text-left"
                  >
                    <span className="flex min-w-0 items-center gap-4">
                      <span
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors ${
                          open ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <Icon name={t.icon} className="text-[18px]" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[15px] font-bold text-slate-900">{t.label}</span>
                        <span className="mt-0.5 block truncate text-[13px] text-slate-500">{t.desc}</span>
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-4">
                      <span className="hidden text-[13px] text-slate-400 sm:block">{t.summary}</span>
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                          open ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <Icon
                          name="pi-chevron-down"
                          className={`text-[12px] transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
                        />
                      </span>
                    </span>
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="border-t border-slate-100 px-5 pb-5">{renderSection(t.key)}</div>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1240px] px-7 py-6">
      <Breadcrumb trail={['Tenants', tenant.name]} onNavigate={onNavigate} />

      {/* Header — sticky (current) or bordered card (alt) */}
      <div
        className={
          alt
            ? 'mt-5'
            : 'sticky top-0 z-20 -mx-7 border-b border-slate-200 bg-white px-7 pb-4 pt-5'
        }
      >
        <div className={alt ? 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm' : ''}>
          <div className="flex items-start gap-4">
          <div
            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${
              alt ? 'bg-indigo-50 text-indigo-600 ring-indigo-100' : 'bg-[#f7f8fa] text-slate-400 ring-slate-200'
            }`}
          >
            <Icon name="pi-building" className="text-[24px]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[20px] font-bold tracking-tight text-slate-900">
                {tenant.name}
              </span>
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[12px] font-semibold text-slate-500 ring-1 ring-inset ring-slate-200/70">
                {d.slug}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[12px] font-bold tracking-wide ring-1 ring-inset ring-black/5 ${STATUS_STYLES[tenant.status]}`}
              >
                <span className="relative flex h-1.5 w-1.5">
                  {active && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  )}
                  <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${STATUS_DOT[tenant.status] || 'bg-slate-400'}`} />
                </span>
                {sentence(tenant.status)}
              </span>
              <Chip variant="blue">{sentence(d.isolationLabel)}</Chip>
            </div>

            {/* Meta — icon + value, left-aligned */}
            <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
              {[
                { icon: 'pi-briefcase', value: tenant.org },
                { icon: 'pi-verified', value: sentence(d.plan) },
                { icon: 'pi-globe', value: d.region },
                { icon: 'pi-users', value: d.stats.activeUsers },
                { icon: 'pi-calendar', value: d.created },
              ].map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Icon name={m.icon} className="text-[14px] text-slate-400" />
                  {isEmpty(m.value) ? (
                    <span className="text-[14px] font-medium italic text-slate-300">Not set</span>
                  ) : (
                    <span className="text-[14px] font-medium text-slate-700">{m.value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50">
              <Icon name="pi-pencil" className="text-[13px] text-slate-500" />
              Edit
            </button>
            <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50">
              <Icon name={active ? 'pi-pause' : 'pi-play'} className="text-[13px] text-slate-500" />
              {active ? 'Suspend' : 'Activate'}
            </button>
            <TenantMenu />
          </div>
          </div>
        </div>

        {/* Tenant details toolbar */}
        <div
          className={
            alt
              ? 'mt-6 flex items-center justify-between gap-3'
              : '-mx-7 mt-4 flex items-center justify-between gap-3 border-t border-slate-200 px-7 pt-4'
          }
        >
        <h2 className="text-[15px] font-bold text-slate-900">Tenant details</h2>
        <div className="flex items-center gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => setNavOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Icon name="pi-list" className="text-[13px] text-slate-500" />
            Quick Navigate
          </button>

          {navOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNavOpen(false)} />
              <div className="absolute right-0 z-20 mt-1.5 max-h-[60vh] w-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => goTo(t.key)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <Icon name={t.icon} className="text-[12px] text-slate-400" />
                    <span className="truncate">{t.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={toggleAll}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          <Icon
            name={allOpen ? 'pi-angle-double-up' : 'pi-angle-double-down'}
            className="text-[13px] text-slate-500"
          />
          {allOpen ? 'Collapse All' : 'Expand All'}
        </button>
        </div>
      </div>
      </div>

      {/* Accordion — full-bleed rows (current) or separate cards (alt) */}
      <div
        className={
          alt
            ? 'mt-4 space-y-3'
            : '-mx-7 divide-y divide-slate-200 border-b border-slate-200'
        }
      >
        {TABS.map((t) => {
          const open = isOpen(t.key)
          const chipCls = open
            ? alt
              ? 'bg-indigo-100 text-indigo-600'
              : 'bg-blue-100 text-blue-600'
            : alt
              ? 'bg-indigo-50 text-indigo-600'
              : 'bg-slate-100 text-slate-500'
          const titleCls = open
            ? alt
              ? 'text-indigo-700'
              : 'text-blue-700'
            : 'text-slate-800'
          const chevCls = open
            ? alt
              ? 'bg-indigo-50 text-indigo-600'
              : 'bg-blue-50 text-blue-600'
            : 'text-slate-400'
          return (
            <div
              key={t.key}
              ref={(el) => (sectionRefs.current[t.key] = el)}
              className={`scroll-mt-[200px] ${
                alt ? 'overflow-hidden rounded-xl border border-slate-200 bg-white' : ''
              }`}
            >
              <button
                type="button"
                onClick={() => toggleKey(t.key)}
                aria-expanded={open}
                className={`relative flex w-full items-center justify-between gap-3 py-3.5 text-left transition-colors ${
                  alt ? 'px-5' : 'px-7'
                } ${open ? 'bg-slate-50/80' : 'hover:bg-slate-50/60'}`}
              >
                {!alt && open && (
                  <span className="absolute inset-y-0 left-0 w-[3px] bg-blue-600" />
                )}
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${chipCls}`}
                  >
                    <Icon name={t.icon} className="text-[15px]" />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className={`text-[14px] font-semibold ${titleCls}`}>{t.label}</span>
                    {alt && (
                      <span className="mt-0.5 truncate text-[12px] font-normal text-slate-400">
                        {t.desc}
                      </span>
                    )}
                  </span>
                </span>
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${chevCls}`}
                >
                  <Icon
                    name="pi-chevron-down"
                    className={`text-[12px] transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
                  />
                </span>
              </button>
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                }`}
              >
                <div className="overflow-hidden">
                  <div className={`border-t border-slate-100 pb-5 ${alt ? 'px-5' : 'px-7'}`}>
                    {renderSection(t.key)}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Create Tenant (wizard)                                             */
/* ------------------------------------------------------------------ */

const STEPS = [
  { n: 1, title: 'Basic Information', sub: 'Tenant identity, plan and region' },
  { n: 2, title: 'Branding', sub: 'Colors and custom domain' },
  { n: 3, title: 'Users', sub: 'Initial tenant users' },
]

function Stepper({ current }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-8 py-7">
      <div className="flex items-start">
        {STEPS.map((s, i) => {
          const active = s.n === current
          const done = s.n < current
          return (
            <Fragment key={s.n}>
              <div className="flex w-44 flex-col items-center text-center">
                <div
                  className={[
                    'flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold',
                    done
                      ? 'border-2 border-emerald-500 bg-white text-emerald-500'
                      : active
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-300 bg-white text-slate-400',
                  ].join(' ')}
                >
                  {done ? <Icon name="pi-check" className="text-[13px]" /> : s.n}
                </div>
                <div
                  className={[
                    'mt-2 text-[13px] font-semibold',
                    active ? 'text-blue-600' : 'text-slate-500',
                  ].join(' ')}
                >
                  {s.title}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-400">{s.sub}</div>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={[
                    'mt-[18px] h-0.5 flex-1',
                    s.n < current ? 'bg-emerald-500' : 'bg-slate-200',
                  ].join(' ')}
                />
              )}
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}

function FieldLabel({ children, required }) {
  return (
    <label className="text-[11px] font-semibold tracking-[0.06em] text-slate-500">
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  )
}

function TextField({ label, required, placeholder, help, type = 'text' }) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        type={type}
        placeholder={placeholder}
        className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
      {help && <p className="mt-1.5 text-[11px] text-slate-400">{help}</p>}
    </div>
  )
}

function SelectField({ label, required, placeholder, options = [], help }) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div className="relative mt-2">
        <select
          defaultValue=""
          className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-[13px] text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="" disabled hidden>
            {placeholder}
          </option>
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <Icon
          name="pi-chevron-down"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400"
        />
      </div>
      {help && <p className="mt-1.5 text-[11px] text-slate-400">{help}</p>}
    </div>
  )
}

function CardHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
      <h2 className="text-[14px] font-semibold text-slate-900">{title}</h2>
      {action}
    </div>
  )
}

/* ---- Step 1: Basic Information ---- */

function BasicInformationStep() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <CardHeader title="Basic Information" />
      <div className="px-6 py-6">
        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
          <TextField
            label="Display name"
            required
            placeholder="Display name"
            help="Shown in the platform UI and emails"
          />
          <TextField
            label="Slug"
            required
            placeholder="lowercase-slug"
            help="Lowercase letters, numbers, hyphens (3–64 chars)"
          />
          <SelectField
            label="Organization"
            placeholder="Select an organization"
            options={['Acme Dev Org', 'Ensylon Nexus Test Org']}
            help="Optional for now — full org wiring lands later"
          />
          <SelectField
            label="Plan"
            required
            placeholder="Select a plan"
            options={['Starter', 'Growth', 'Enterprise']}
          />
          <SelectField
            label="Region"
            required
            placeholder="Select a region"
            options={['us-east-1', 'us-west-2', 'eu-west-1', 'ap-south-1']}
          />
          <SelectField
            label="Isolation mode"
            required
            placeholder="Select an isolation mode"
            options={['Shared', 'Dedicated', 'Sandbox']}
          />
          <div className="col-span-2">
            <TextField
              label="Contact email"
              required
              type="email"
              placeholder="admin@example.com"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---- Step 2: Branding ---- */

function Dropzone({ label, hint }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="mt-2 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/40 px-4 py-6 text-center">
        <Icon name="pi-cloud-upload" className="text-[22px] text-slate-300" />
        <div className="mt-2 text-[13px] font-semibold text-slate-700">
          Drag and drop files here
        </div>
        <div className="mt-1 text-[11px] text-slate-400">Maximum file size of 1 MB</div>
        <button className="mt-3 rounded-lg bg-blue-600 px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-blue-700">
          Browse
        </button>
      </div>
      <p className="mt-1.5 text-[11px] text-slate-400">{hint}</p>
    </div>
  )
}

function ColorField({ label, swatchClass, value }) {
  return (
    <div>
      <FieldLabel required>{label}</FieldLabel>
      <div className="mt-2 flex items-center gap-2">
        <span className={`h-7 w-7 rounded-md ${swatchClass}`} />
        <span className="text-[12px] text-slate-400">{value}</span>
      </div>
    </div>
  )
}

function BrandingStep() {
  return (
    <div className="grid grid-cols-2 items-start gap-6">
      {/* Brand Assets */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <CardHeader title="Brand Assets" />
        <div className="space-y-6 px-6 py-6">
          <div className="grid grid-cols-2 gap-5">
            <Dropzone label="Logo (light theme)" hint="PNG or SVG, max 1MB" />
            <Dropzone label="Logo (dark theme)" hint="PNG or SVG, max 1MB" />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <Dropzone label="Favicon" hint="PNG or SVG, max 1MB" />
            <div />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <ColorField
              label="Primary color"
              swatchClass="bg-[#1D4ED8]"
              value="#1D4ED8"
            />
            <ColorField
              label="Accent color"
              swatchClass="bg-[#10B981]"
              value="#10B981"
            />
          </div>
          <TextField
            label="Custom domain"
            placeholder="app.example.com"
            help="Optional. CNAME → nexus.ensylon.com"
          />
        </div>
      </div>

      {/* Live Preview */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <CardHeader title="Live Preview" />
        <div className="px-6 py-6">
          <div className="rounded-xl bg-slate-100/70 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1D4ED8] text-[12px] font-bold text-white">
                TE
              </div>
              <span className="text-[15px] font-semibold text-slate-900">test</span>
            </div>
            <div className="mt-4 flex gap-3">
              <button className="rounded-lg bg-[#1D4ED8] px-3.5 py-2 text-[12px] font-semibold text-white">
                Primary Action
              </button>
              <button className="rounded-lg bg-[#10B981] px-3.5 py-2 text-[12px] font-semibold text-white">
                Accent
              </button>
            </div>
          </div>
          <p className="mt-4 text-[12px] text-slate-400">
            Updates as you tweak the logo, colors, and the display name from step 1.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ---- Step 3: Users ---- */

function UserRow({ onRemove }) {
  return (
    <div className="rounded-xl border border-slate-200 p-5">
      <div className="grid grid-cols-3 gap-5">
        <TextField label="First name" required placeholder="Sarah" />
        <TextField label="Last name" required placeholder="Kim" />
        <TextField label="Email" required type="email" placeholder="sarah.kim@example.com" />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-5">
        <TextField label="Username" required placeholder="sarah.kim@example.com" />
        <SelectField
          label="Roles"
          required
          placeholder="Select role(s)"
          options={['Admin', 'Editor', 'Viewer', 'Billing']}
        />
        <div>
          <span className="block text-[11px] font-semibold tracking-[0.06em]">
            &nbsp;
          </span>
          <button
            onClick={onRemove}
            className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-red-600 text-[13px] font-semibold text-white hover:bg-red-700"
          >
            <Icon name="pi-trash" className="text-[13px]" />
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}

function UsersStep() {
  const [rows, setRows] = useState([0])
  const [nextId, setNextId] = useState(1)

  const addUser = () => {
    setRows((r) => [...r, nextId])
    setNextId((n) => n + 1)
  }
  const removeUser = (id) => setRows((r) => r.filter((x) => x !== id))

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <CardHeader
        title="Initial Users"
        action={
          <button
            onClick={addUser}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-blue-700"
          >
            <Icon name="pi-plus" className="text-[12px]" />
            Add User
          </button>
        }
      />
      <div className="space-y-5 px-6 py-6">
        {rows.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-[13px] text-slate-400">
            No users yet — click “Add User” to invite someone.
          </div>
        ) : (
          rows.map((id) => <UserRow key={id} onRemove={() => removeUser(id)} />)
        )}
      </div>
    </div>
  )
}

function CreateTenant({ onNavigate }) {
  const [step, setStep] = useState(1)

  return (
    <div className="mx-auto max-w-[1240px] px-7 py-6">
      <Breadcrumb trail={['Tenants', 'New']} onNavigate={onNavigate} />

      <div className="mt-5">
        <h1 className="text-[22px] font-bold text-slate-900">Create Tenant</h1>
        <p className="mt-1 text-[13px] text-slate-400">
          Provision a new tenant under an organization
        </p>
      </div>

      <div className="mt-6">
        <Stepper current={step} />
      </div>

      <div className="mt-6">
        {step === 1 && <BasicInformationStep />}
        {step === 2 && <BrandingStep />}
        {step === 3 && <UsersStep />}
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => onNavigate('Tenants')}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Back
          </button>
          <button
            onClick={() =>
              step < STEPS.length ? setStep((s) => s + 1) : onNavigate('Tenants')
            }
            className="rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-blue-700"
          >
            {step < STEPS.length ? 'Next' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Placeholder for unimplemented sections                             */
/* ------------------------------------------------------------------ */

function Placeholder({ title }) {
  return (
    <div className="mx-auto max-w-[1240px] px-7 py-6">
      <h1 className="text-[22px] font-bold text-slate-900">{title}</h1>
      <div className="mt-6 flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-[13px] text-slate-400">
        {title} — coming soon
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* FMO mode                                                           */
/* ------------------------------------------------------------------ */

const FMO_NAV = [
  {
    title: 'FMO',
    items: [
      { label: 'Command centre', icon: 'pi-th-large' },
      { label: 'Statement Upload', icon: 'pi-upload' },
      { label: 'Exception Queue', icon: 'pi-exclamation-triangle' },
      { label: 'Reports', icon: 'pi-file' },
      { label: 'Scheduled Reports', icon: 'pi-clock' },
      { label: 'Download History', icon: 'pi-download' },
      { label: 'Assistant', icon: 'pi-comment' },
    ],
  },
  {
    title: 'COMPENSATION',
    items: [
      { label: 'Comp Plans', icon: 'pi-percentage', badge: 1 },
      { label: 'Commission Ledger', icon: 'pi-book' },
      { label: 'Reconciliation', icon: 'pi-sync' },
      { label: 'Disputes', icon: 'pi-flag' },
      { label: 'Payroll Runs', icon: 'pi-money-bill' },
      { label: 'Ghost & Anomaly Recovery', icon: 'pi-eye-slash' },
      { label: 'Advisories', icon: 'pi-lightbulb' },
    ],
  },
  {
    title: 'DISTRIBUTION',
    items: [
      { label: 'Agencies', icon: 'pi-building', badge: 2 },
      { label: 'Agents', icon: 'pi-users' },
      { label: 'Hierarchy', icon: 'pi-sitemap' },
      { label: 'AOR Management', icon: 'pi-arrows-h' },
      { label: 'Advisories', icon: 'pi-lightbulb' },
    ],
  },
  {
    title: 'ENROLLMENT',
    items: [
      { label: 'Member Roster', icon: 'pi-users' },
      { label: 'QLE Events', icon: 'pi-clock', badge: 7 },
      { label: 'Ghost Members', icon: 'pi-eye-slash' },
      { label: 'Missing Renewals', icon: 'pi-calendar-times' },
      { label: 'Duplicate Pairs', icon: 'pi-clone' },
      { label: 'Premium Ledger', icon: 'pi-dollar' },
      { label: 'Advisories', icon: 'pi-lightbulb' },
    ],
  },
  {
    title: 'CARRIERS',
    items: [
      { label: 'Carrier Directory', icon: 'pi-building', badge: 22 },
      { label: 'Missing Statements', icon: 'pi-book' },
      { label: 'Advisories', icon: 'pi-lightbulb' },
    ],
  },
  {
    title: 'PRODUCTS',
    items: [
      { label: 'Product Lines', icon: 'pi-share-alt' },
      { label: 'Products', icon: 'pi-box', badge: 28 },
      { label: 'Plans', icon: 'pi-list', badge: 32 },
      { label: 'Rate Schedules', icon: 'pi-dollar', badge: 3 },
      { label: 'Riders', icon: 'pi-tablet' },
      { label: 'Forms', icon: 'pi-file' },
      { label: 'Advisories', icon: 'pi-lightbulb' },
      { label: 'Reference Data', icon: 'pi-sliders-h' },
    ],
  },
  {
    title: 'IDENTITY',
    items: [
      { label: 'Parties', icon: 'pi-users', badge: 36 },
      { label: 'Households', icon: 'pi-home', badge: 3 },
      { label: 'Advisories', icon: 'pi-lightbulb' },
    ],
  },
  {
    title: 'PAYMENTS',
    items: [
      { label: 'NACHA Operations', icon: 'pi-credit-card', badge: 2 },
      { label: 'Settlements', icon: 'pi-check-square', badge: 4 },
      { label: 'NACHA Compliance', icon: 'pi-verified' },
    ],
  },
  {
    title: 'RULES ENGINE',
    items: [{ label: 'Rules & Decisions', icon: 'pi-cog' }],
  },
]

const CC_KPIS = [
  {
    key: 'commission',
    icon: 'pi-dollar',
    tone: 'indigo',
    label: 'Commission earned (MTD)',
    value: '$284.5K',
    delta: '+14.2%',
    up: true,
    context: 'vs. $249.1K last month',
  },
  {
    key: 'pending',
    icon: 'pi-clock',
    tone: 'amber',
    label: 'Pending commissions',
    value: '$42.1K',
    delta: '128 txns',
    up: null,
    context: 'awaiting payout processing',
  },
  {
    key: 'revenue',
    icon: 'pi-chart-line',
    tone: 'emerald',
    label: 'Agency revenue (MTD)',
    value: '$1.24M',
    delta: '+9.3%',
    up: true,
    context: 'on pace for $1.4M',
  },
  {
    key: 'agents',
    icon: 'pi-users',
    tone: 'blue',
    label: 'Active agents',
    value: '48',
    delta: '+5 new',
    up: true,
    context: 'added this month',
  },
  {
    key: 'renewals',
    icon: 'pi-refresh',
    tone: 'violet',
    label: 'Upcoming renewals',
    value: '32',
    delta: '~$96K',
    up: null,
    context: 'due within 30 days',
  },
]

const CC_KPI_TONES = {
  indigo: 'bg-indigo-50 text-indigo-600',
  amber: 'bg-amber-50 text-amber-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  blue: 'bg-blue-50 text-blue-600',
  violet: 'bg-violet-50 text-violet-600',
  rose: 'bg-rose-50 text-rose-600',
  teal: 'bg-teal-50 text-teal-600',
}

const CC_ATTENTION = [
  {
    severity: 'critical',
    icon: 'pi-flag-fill',
    title: '4 open disputes need a response',
    meta: '$18.4K in dispute · 2 overdue',
    action: 'Review disputes',
    to: 'Disputes',
  },
  {
    severity: 'critical',
    icon: 'pi-file-excel',
    title: '2 carrier statements missing',
    meta: 'Aetna & Cigna — June cycle',
    action: 'Upload statement',
    to: 'Statement Upload',
  },
  {
    severity: 'warning',
    icon: 'pi-inbox',
    title: '6 commission statements awaiting review',
    meta: 'Flagged during import',
    action: 'Open ledger',
    to: 'Commission Ledger',
  },
  {
    severity: 'warning',
    icon: 'pi-money-bill',
    title: '3 payroll approvals pending',
    meta: 'June run · $61.2K total',
    action: 'Approve payroll',
    to: 'Payroll Runs',
  },
  {
    severity: 'warning',
    icon: 'pi-id-card',
    title: '5 agent licenses expiring soon',
    meta: 'Within the next 60 days',
    action: 'View agents',
    to: 'Agents',
  },
  {
    severity: 'info',
    icon: 'pi-sync',
    title: '15 reconciliation exceptions',
    meta: 'Unmatched carrier records',
    action: 'Reconcile',
    to: 'Reconciliation',
  },
]

const CC_SEVERITY = {
  critical: { dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-600', label: 'Critical', ring: 'text-rose-500' },
  warning: { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-600', label: 'Warning', ring: 'text-amber-500' },
  info: { dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-600', label: 'Info', ring: 'text-blue-500' },
}

// [paid, pending, chargebacks] as % of chart height; earned = sum
const CC_CHART = {
  Weekly: [
    { label: 'Mon', paid: 40, pending: 14, cb: 4 },
    { label: 'Tue', paid: 52, pending: 10, cb: 3 },
    { label: 'Wed', paid: 47, pending: 16, cb: 5 },
    { label: 'Thu', paid: 61, pending: 12, cb: 2 },
    { label: 'Fri', paid: 74, pending: 15, cb: 6 },
    { label: 'Sat', paid: 33, pending: 8, cb: 2 },
    { label: 'Sun', paid: 26, pending: 6, cb: 1 },
  ],
  Monthly: [
    { label: 'Jan', paid: 58, pending: 18, cb: 5 },
    { label: 'Feb', paid: 63, pending: 16, cb: 4 },
    { label: 'Mar', paid: 55, pending: 21, cb: 7 },
    { label: 'Apr', paid: 70, pending: 15, cb: 4 },
    { label: 'May', paid: 66, pending: 19, cb: 6 },
    { label: 'Jun', paid: 78, pending: 14, cb: 3 },
  ],
  Quarterly: [
    { label: 'Q1', paid: 62, pending: 20, cb: 6 },
    { label: 'Q2', paid: 74, pending: 17, cb: 5 },
    { label: 'Q3', paid: 69, pending: 22, cb: 7 },
    { label: 'Q4', paid: 81, pending: 15, cb: 4 },
  ],
}

const CC_TOP_AGENTS = [
  { name: 'Marcus Bell', region: 'Southeast', revenue: '$186K', comm: '$24.8K', growth: '+22%' },
  { name: 'Priya Nair', region: 'Northeast', revenue: '$171K', comm: '$21.3K', growth: '+18%' },
  { name: 'Daniel Cho', region: 'West', revenue: '$154K', comm: '$19.1K', growth: '+15%' },
  { name: 'Sofia Ramos', region: 'Midwest', revenue: '$142K', comm: '$17.6K', growth: '+11%' },
]

const CC_ATTN_AGENTS = [
  { name: 'Greg Palmer', issue: 'No production in 21 days', tag: 'Inactive', tone: 'rose' },
  { name: 'Nina Owens', issue: 'Production down 34% MoM', tag: 'Declining', tone: 'amber' },
  { name: 'Owen Frost', issue: 'License expires in 12 days', tag: 'License', tone: 'amber' },
  { name: 'Talia Reed', issue: 'Onboarding incomplete', tag: 'Pending', tone: 'blue' },
]

const CC_CARRIERS = [
  { name: 'Aetna', policies: 1240, revenue: '$596K', share: 48 },
  { name: 'UnitedHealth', policies: 780, revenue: '$312K', share: 25 },
  { name: 'Cigna', policies: 460, revenue: '$187K', share: 15 },
  { name: 'Humana', policies: 310, revenue: '$149K', share: 12 },
]

const CC_GROWTH = [
  { label: 'New clients', value: '86', delta: '+12%', up: true },
  { label: 'New policies', value: '214', delta: '+8%', up: true },
  { label: 'Revenue growth', value: '9.3%', delta: '+1.4pt', up: true },
  { label: 'Agent growth', value: '48', delta: '+5', up: true },
]

const CC_INSIGHTS = [
  { text: 'Revenue increased 14% compared to last month, led by Medicare Advantage.', tone: 'emerald' },
  { text: '5 agents are showing declining production — 2 with no activity in 3 weeks.', tone: 'amber' },
  { text: '32 renewals require attention this month; ~$28K is at risk.', tone: 'violet' },
  { text: 'Carrier Aetna generated 48% of total revenue — high concentration.', tone: 'blue' },
  { text: 'Potential commission discrepancies detected across 15 records.', tone: 'rose' },
]

const CC_INSIGHT_TONES = {
  emerald: 'text-emerald-600',
  amber: 'text-amber-600',
  violet: 'text-violet-600',
  blue: 'text-blue-600',
  rose: 'text-rose-600',
}

const CC_QUICK = [
  { icon: 'pi-upload', label: 'Upload statement', to: 'Statement Upload' },
  { icon: 'pi-sync', label: 'Run reconciliation', to: 'Reconciliation' },
  { icon: 'pi-refresh', label: 'Review renewals', to: 'Missing Renewals' },
  { icon: 'pi-book', label: 'Commission ledger', to: 'Commission Ledger' },
  { icon: 'pi-file', label: 'Generate report', to: 'Reports' },
  { icon: 'pi-user-plus', label: 'Invite agent', to: 'Agents' },
  { icon: 'pi-sparkles', label: 'AI assistant', to: 'Assistant' },
]

function CcCard({ className = '', children }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white ${className}`}>{children}</div>
  )
}

function CcDelta({ delta, up }) {
  if (up === null)
    return <span className="text-[12px] font-semibold text-slate-400">{delta}</span>
  return (
    <span
      className={`inline-flex items-center gap-1 text-[12px] font-semibold ${up ? 'text-emerald-600' : 'text-rose-600'}`}
    >
      <Icon name={up ? 'pi-arrow-up-right' : 'pi-arrow-down-right'} className="text-[10px]" />
      {delta}
    </span>
  )
}

function CommandCentre({ onNavigate = () => {} }) {
  const [range, setRange] = useState('Monthly')
  const chart = CC_CHART[range]

  // Line-chart series (value 0..100 maps to $0..$300K on the y-axis)
  const n = chart.length
  const xOf = (i) => (n === 1 ? 50 : (i / (n - 1)) * 100)
  const mkSeries = (key, stroke, valFn) => {
    const pts = chart.map((m, i) => ({ x: xOf(i), y: 100 - valFn(m) }))
    return { key, stroke, pts, points: pts.map((p) => `${p.x},${p.y}`).join(' ') }
  }
  const ccSeries = [
    mkSeries('Earned', '#6366f1', (m) => m.paid + m.pending + m.cb),
    mkSeries('Paid', '#10b981', (m) => m.paid),
    mkSeries('Pending', '#f59e0b', (m) => m.pending),
    mkSeries('Chargebacks', '#f43f5e', (m) => m.cb),
  ]
  const ccEarnedArea = `0,100 ${ccSeries[0].points} 100,100`

  return (
    <div className="mx-auto max-w-[1240px] px-7 py-6">
      {/* Hero */}
      <div>
        <h1 className="text-[24px] font-bold tracking-tight text-slate-900">Command centre</h1>
        <p className="mt-1 text-[13px] text-slate-500">
          Here's an overview of your agency's performance and opportunities today.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          {/* Growth status */}
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 py-1.5 pl-2.5 pr-3.5 ring-1 ring-emerald-100">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[10px] font-medium uppercase tracking-wide text-emerald-500/80">
                Growth status
              </span>
              <span className="text-[12.5px] font-semibold text-emerald-700">Growing</span>
            </span>
          </div>

          {/* Agency tier */}
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 py-1.5 pl-2 pr-3.5 ring-1 ring-indigo-100">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white">
              <Icon name="pi-star-fill" className="text-[10px]" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[10px] font-medium uppercase tracking-wide text-indigo-500/80">
                Agency tier
              </span>
              <span className="text-[12.5px] font-semibold text-indigo-700">Platinum</span>
            </span>
          </div>

          {/* Active agents (clickable) */}
          <button
            onClick={() => onNavigate('Agents')}
            className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-2 pr-3.5 transition-colors hover:border-indigo-300 hover:bg-indigo-50/40"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors group-hover:bg-indigo-100 group-hover:text-indigo-600">
              <Icon name="pi-users" className="text-[10px]" />
            </span>
            <span className="flex flex-col leading-tight text-left">
              <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                Active agents
              </span>
              <span className="text-[12.5px] font-semibold text-slate-700 group-hover:text-indigo-700">
                48 agents
              </span>
            </span>
            <Icon
              name="pi-arrow-right"
              className="text-[9px] text-slate-300 transition-colors group-hover:text-indigo-500"
            />
          </button>

          {/* Data sync */}
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-2 pr-3.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <Icon name="pi-sync" className="text-[10px]" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                Data sync
              </span>
              <span className="text-[12.5px] font-semibold text-slate-700">Synced 4m ago</span>
            </span>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {CC_KPIS.map((k) => (
          <CcCard key={k.key} className="p-4">
            <div className="flex items-center justify-between">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl ${CC_KPI_TONES[k.tone]}`}
              >
                <Icon name={k.icon} className="text-[14px]" />
              </span>
              <CcDelta delta={k.delta} up={k.up} />
            </div>
            <div className="mt-3 truncate text-[12px] font-semibold text-slate-600">{k.label}</div>
            <div className="mt-1 text-[25px] font-bold leading-none tracking-tight text-slate-900">
              {k.value}
            </div>
            <div className="mt-1.5 truncate text-[11.5px] text-slate-400">{k.context}</div>
          </CcCard>
        ))}
      </div>

      {/* Main grid */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-4 lg:col-span-2">
          {/* Commission performance */}
          <CcCard className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Icon name="pi-chart-bar" className="text-[14px]" />
                </span>
                <div>
                  <h2 className="text-[15px] font-semibold text-slate-900">Commission performance</h2>
                  <p className="mt-0.5 text-[12px] text-slate-400">
                    Earned, paid, pending and chargebacks over time.
                  </p>
                </div>
              </div>
              <div className="flex rounded-lg border border-slate-200 p-0.5">
                {['Weekly', 'Monthly', 'Quarterly'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                      range === r ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart */}
            <div className="mt-5 flex h-56 gap-3">
              {/* y-axis */}
              <div className="flex w-10 flex-col justify-between pb-6 text-right text-[10px] font-medium text-slate-300">
                {['$300K', '$225K', '$150K', '$75K', '$0'].map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
              {/* plot */}
              <div className="relative flex-1">
                {/* gridlines */}
                <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`border-t ${i === 4 ? 'border-slate-200' : 'border-dashed border-slate-100'}`}
                    />
                  ))}
                </div>
                {/* lines */}
                <div className="absolute inset-x-0 top-0 bottom-6">
                  <svg
                    className="h-full w-full overflow-visible"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="ccEarnedFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.16" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <polygon points={ccEarnedArea} fill="url(#ccEarnedFill)" stroke="none" />
                    {ccSeries.map((s) => (
                      <polyline
                        key={s.key}
                        points={s.points}
                        fill="none"
                        stroke={s.stroke}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    ))}
                  </svg>
                  {/* markers */}
                  {ccSeries.map((s) =>
                    s.pts.map((p, i) => (
                      <span
                        key={s.key + i}
                        className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white"
                        style={{ left: `${p.x}%`, top: `${p.y}%`, backgroundColor: s.stroke }}
                      />
                    )),
                  )}
                </div>
                {/* x labels */}
                <div className="absolute inset-x-0 bottom-0 h-4">
                  {chart.map((m, i) => (
                    <span
                      key={m.label}
                      className="absolute -translate-x-1/2 text-[11px] text-slate-400"
                      style={{ left: `${xOf(i)}%` }}
                    >
                      {m.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Legend + actions */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <div className="flex flex-wrap items-center gap-4 text-[11.5px] text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-0.5 w-3.5 rounded-full bg-indigo-500" /> Earned
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-0.5 w-3.5 rounded-full bg-emerald-500" /> Paid
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-0.5 w-3.5 rounded-full bg-amber-500" /> Pending
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-0.5 w-3.5 rounded-full bg-rose-500" /> Chargebacks
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('Commission Ledger')}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-indigo-700"
                >
                  View ledger
                </button>
                <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-semibold text-slate-600 transition-colors hover:bg-slate-50">
                  Export report
                </button>
              </div>
            </div>
          </CcCard>

          {/* Agent performance */}
          <CcCard className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Icon name="pi-users" className="text-[14px]" />
                </span>
                <h2 className="text-[15px] font-semibold text-slate-900">Agent performance</h2>
              </div>
              <button
                onClick={() => onNavigate('Agents')}
                className="text-[12px] font-semibold text-indigo-600 hover:text-indigo-700"
              >
                View all agents
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Top performers */}
              <div>
                <div className="mb-2 text-[12px] font-semibold text-slate-500">
                  Top performing
                </div>
                <div className="space-y-1">
                  {CC_TOP_AGENTS.map((a, i) => (
                    <div
                      key={a.name}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-[11px] font-bold text-indigo-600">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-semibold text-slate-800">
                          {a.name}
                        </div>
                        <div className="text-[11.5px] text-slate-400">
                          {a.region} · {a.revenue} revenue
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[12.5px] font-semibold text-slate-700">{a.comm}</div>
                        <div className="text-[11px] font-semibold text-emerald-600">{a.growth}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Needs attention */}
              <div>
                <div className="mb-2 text-[12px] font-semibold text-slate-500">
                  Needs attention
                </div>
                <div className="space-y-1">
                  {CC_ATTN_AGENTS.map((a) => (
                    <div
                      key={a.name}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-semibold text-slate-800">
                          {a.name}
                        </div>
                        <div className="truncate text-[11.5px] text-slate-400">{a.issue}</div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${CC_SEVERITY[a.tone === 'rose' ? 'critical' : a.tone === 'amber' ? 'warning' : 'info'].chip}`}
                      >
                        {a.tag}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CcCard>

          {/* Carrier performance */}
          <CcCard className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Icon name="pi-building" className="text-[14px]" />
                </span>
                <div>
                  <h2 className="text-[15px] font-semibold text-slate-900">Carrier performance</h2>
                  <p className="mt-0.5 text-[12px] text-slate-400">
                    Revenue contribution by top carriers.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('Carrier Directory')}
                className="text-[12px] font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Carrier directory
              </button>
            </div>
            <div className="mt-4 space-y-3.5">
              {CC_CARRIERS.map((c) => (
                <div key={c.name}>
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="font-semibold text-slate-800">{c.name}</span>
                    <span className="text-slate-500">
                      {c.policies.toLocaleString()} policies ·{' '}
                      <span className="font-semibold text-slate-700">{c.revenue}</span> ·{' '}
                      <span className="font-semibold text-indigo-600">{c.share}%</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-indigo-500" style={{ width: `${c.share}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CcCard>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Attention required */}
          <CcCard className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <Icon name="pi-exclamation-circle" className="text-[14px]" />
                </span>
                <h2 className="text-[15px] font-semibold text-slate-900">Attention required</h2>
              </div>
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-600">
                6
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {CC_ATTENTION.map((a, i) => {
                const s = CC_SEVERITY[a.severity]
                return (
                  <div
                    key={i}
                    className="rounded-xl border border-slate-100 p-3 transition-colors hover:border-slate-200 hover:bg-slate-50/50"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className={`mt-0.5 ${s.ring}`}>
                        <Icon name={a.icon} className="text-[13px]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12.5px] font-semibold text-slate-800">{a.title}</div>
                        <div className="mt-0.5 text-[11.5px] text-slate-400">{a.meta}</div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${s.chip}`}>
                        {s.label}
                      </span>
                    </div>
                    <button
                      onClick={() => onNavigate(a.to)}
                      className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      {a.action}
                      <Icon name="pi-arrow-right" className="text-[9px]" />
                    </button>
                  </div>
                )
              })}
            </div>
          </CcCard>

          {/* Renewal intelligence */}
          <CcCard className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Icon name="pi-refresh" className="text-[14px]" />
                </span>
                <h2 className="text-[15px] font-semibold text-slate-900">Renewal intelligence</h2>
              </div>
              <button
                onClick={() => onNavigate('Missing Renewals')}
                className="text-[12px] font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Pipeline
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <div className="text-[19px] font-bold leading-none text-slate-900">7</div>
                <div className="mt-1 text-[11.5px] text-slate-500">Due this week</div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <div className="text-[19px] font-bold leading-none text-slate-900">32</div>
                <div className="mt-1 text-[11.5px] text-slate-500">Due this month</div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <div className="text-[19px] font-bold leading-none text-emerald-600">91%</div>
                <div className="mt-1 text-[11.5px] text-slate-500">Retention rate</div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <div className="text-[19px] font-bold leading-none text-slate-900">$96K</div>
                <div className="mt-1 text-[11.5px] text-slate-500">Revenue forecast</div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-[12px] text-amber-700 ring-1 ring-amber-100">
              <Icon name="pi-exclamation-triangle" className="text-[13px]" />
              <span>
                <span className="font-semibold">4 at-risk accounts</span> · ~$28K revenue exposure
              </span>
            </div>
          </CcCard>

        </div>
      </div>

      {/* Agency growth + AI insights side by side */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Agency growth */}
        <CcCard className="p-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Icon name="pi-chart-line" className="text-[14px]" />
            </span>
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">Agency growth</h2>
              <p className="mt-0.5 text-[12px] text-slate-400">Month-over-month momentum.</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {CC_GROWTH.map((g) => (
              <div key={g.label} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                <div className="text-[20px] font-bold leading-none text-slate-900">{g.value}</div>
                <div className="mt-1.5 text-[11.5px] text-slate-500">{g.label}</div>
                <div className="mt-1.5">
                  <CcDelta delta={g.delta} up={g.up} />
                </div>
              </div>
            ))}
          </div>
        </CcCard>

        {/* AI insights */}
        <CcCard className="p-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Icon name="pi-sparkles" className="text-[14px]" />
            </span>
            <h2 className="text-[15px] font-semibold text-slate-900">AI insights</h2>
          </div>
          <div className="mt-3 space-y-1.5">
            {CC_INSIGHTS.map((ins, i) => (
              <button
                key={i}
                onClick={() => onNavigate('Assistant')}
                className="flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-slate-50"
              >
                <Icon name="pi-sparkles" className={`mt-0.5 text-[12px] ${CC_INSIGHT_TONES[ins.tone]}`} />
                <span className="text-[12.5px] leading-snug text-slate-600">{ins.text}</span>
              </button>
            ))}
          </div>
        </CcCard>
      </div>
    </div>
  )
}

function FmoCrumb({ title, onNavigate }) {
  return (
    <nav className="flex items-center gap-2 text-[13px] text-slate-400">
      <button
        type="button"
        onClick={() => onNavigate('Command centre')}
        className="font-medium text-slate-500 transition-colors hover:text-indigo-600"
      >
        Command centre
      </button>
      <span className="text-slate-300">/</span>
      <span className="font-medium text-slate-700">{title}</span>
    </nav>
  )
}

function FmoPageHead({ title, subtitle, action }) {
  return (
    <div className="mt-5 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-1 text-[13px] text-slate-500">{subtitle}</p>
      </div>
      {action}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Statement Operations (FMO · Statement Upload)                       */
/* ------------------------------------------------------------------ */

const SO_KPI_TONES = {
  indigo: 'bg-indigo-50 text-indigo-600',
  blue: 'bg-blue-50 text-blue-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
  slate: 'bg-slate-100 text-slate-500',
}

const SO_KPIS = [
  { key: 'uploaded', label: 'Uploaded today', value: '8', tone: 'indigo', icon: 'pi-cloud-upload', delta: '+3', up: true, context: 'vs. 5 yesterday' },
  { key: 'processing', label: 'Processing', value: '2', tone: 'blue', icon: 'pi-spin pi-spinner', delta: 'Live', up: null, context: 'in ingestion pipeline' },
  { key: 'reconciled', label: 'Reconciled', value: '5', tone: 'emerald', icon: 'pi-check-circle', delta: '+2', up: true, context: '98% match rate' },
  { key: 'review', label: 'Pending review', value: '3', tone: 'amber', icon: 'pi-exclamation-triangle', delta: '+1', up: false, context: 'awaiting analyst' },
  { key: 'exceptions', label: 'Exceptions', value: '11', tone: 'rose', icon: 'pi-flag-fill', delta: '+4', up: false, context: 'across 3 statements' },
  { key: 'failed', label: 'Failed imports', value: '1', tone: 'slate', icon: 'pi-times-circle', delta: '0', up: null, context: 'last 7 days' },
]

const SO_STATUS = {
  Processing: { chip: 'bg-blue-50 text-blue-700 ring-blue-100', dot: 'bg-blue-500', icon: 'pi-spin pi-spinner' },
  Reconciled: { chip: 'bg-emerald-50 text-emerald-700 ring-emerald-100', dot: 'bg-emerald-500', icon: 'pi-check-circle' },
  'Review Required': { chip: 'bg-amber-50 text-amber-700 ring-amber-100', dot: 'bg-amber-500', icon: 'pi-exclamation-triangle' },
  Failed: { chip: 'bg-rose-50 text-rose-700 ring-rose-100', dot: 'bg-rose-500', icon: 'pi-times-circle' },
  'Already Ingested': { chip: 'bg-violet-50 text-violet-700 ring-violet-100', dot: 'bg-violet-500', icon: 'pi-clone' },
}

const SO_STAGES = ['Upload', 'Ingestion', 'Classification', 'Commission Ledger', 'Reconciliation', 'Exception Queue']
const SO_STAGE_ICONS = ['pi-upload', 'pi-database', 'pi-sitemap', 'pi-book', 'pi-sync', 'pi-flag']

const SO_STAGE_TONE = {
  done: { ring: 'border-emerald-200 bg-emerald-50 text-emerald-600', line: 'bg-emerald-300', label: 'text-slate-700', badge: 'text-emerald-600', badgeText: 'Completed', icon: 'pi-check' },
  active: { ring: 'border-blue-300 bg-blue-50 text-blue-600', line: 'bg-slate-200', label: 'text-slate-900', badge: 'text-blue-600', badgeText: 'In progress', icon: 'pi-spin pi-spinner' },
  pending: { ring: 'border-slate-200 bg-white text-slate-300', line: 'bg-slate-200', label: 'text-slate-400', badge: 'text-slate-400', badgeText: 'Pending', icon: null },
  failed: { ring: 'border-rose-300 bg-rose-50 text-rose-600', line: 'bg-slate-200', label: 'text-slate-900', badge: 'text-rose-600', badgeText: 'Failed', icon: 'pi-times' },
}

const SO_UPLOADS = [
  {
    id: 'STM-2043', file: 'Aetna_Commissions_2026-06.xlsx', carrier: 'Aetna', period: 'Jun 2026',
    uploadedAt: 'Jul 10, 2026 · 09:12', status: 'Reconciled', rows: 4820, exceptions: 3,
    uploadedBy: 'Obaid Khan', size: '2.4 MB', accepted: 4796, rejected: 24, duplicates: 12,
    duration: '1m 48s', matched: 4740, unmatched: 56, recon: 'Reconciled · 98% matched',
    states: ['done', 'done', 'done', 'done', 'done', 'active'],
    insights: [
      { tone: 'emerald', icon: 'pi-check-circle', title: 'Reconciliation at 98%', detail: '4,740 of 4,796 accepted records matched to the commission ledger.', action: 'Open reconciliation' },
      { tone: 'amber', icon: 'pi-flag', title: '3 exceptions require review', detail: 'Rate mismatch on 3 policies flagged during matching.', action: 'Open exception queue' },
      { tone: 'blue', icon: 'pi-clone', title: '12 duplicate records detected', detail: 'Duplicates were auto-suppressed and excluded from the ledger.', action: 'View duplicates' },
    ],
  },
  {
    id: 'STM-2042', file: 'UHC_Statement_Q2_2026.csv', carrier: 'UnitedHealthcare', period: 'Q2 2026',
    uploadedAt: 'Jul 10, 2026 · 08:47', status: 'Processing', rows: 9120, exceptions: 0,
    uploadedBy: 'Obaid Khan', size: '5.1 MB', accepted: 6300, rejected: 0, duplicates: 4,
    duration: '—', matched: 0, unmatched: 0, recon: 'Awaiting classification',
    states: ['done', 'done', 'active', 'pending', 'pending', 'pending'],
    insights: [
      { tone: 'blue', icon: 'pi-spin pi-spinner', title: 'Classification in progress', detail: '6,300 of 9,120 rows classified. Estimated 2m remaining.', action: 'View processing log' },
      { tone: 'blue', icon: 'pi-clone', title: '4 potential duplicates', detail: 'Records match earlier Q1 submissions and are held for review.', action: 'Review duplicates' },
    ],
  },
  {
    id: 'STM-2041', file: 'Humana_June_Commissions.xlsx', carrier: 'Humana', period: 'Jun 2026',
    uploadedAt: 'Jul 09, 2026 · 17:20', status: 'Review Required', rows: 3110, exceptions: 8,
    uploadedBy: 'Priya Nair', size: '1.8 MB', accepted: 2980, rejected: 130, duplicates: 0,
    duration: '1m 12s', matched: 2790, unmatched: 190, recon: 'Blocked · 8 exceptions',
    states: ['done', 'done', 'done', 'done', 'failed', 'pending'],
    insights: [
      { tone: 'rose', icon: 'pi-exclamation-triangle', title: '8 exceptions require review', detail: 'Unmatched agent NPNs are blocking reconciliation completion.', action: 'Open exception queue' },
      { tone: 'amber', icon: 'pi-sitemap', title: 'Mapping configuration may need adjustment', detail: '130 rows rejected due to an unrecognized column layout.', action: 'Adjust mapping' },
    ],
  },
  {
    id: 'STM-2040', file: 'Cigna_Statement_2026-06.csv', carrier: 'Unknown', period: 'Jun 2026',
    uploadedAt: 'Jul 09, 2026 · 14:05', status: 'Failed', rows: 0, exceptions: 0,
    uploadedBy: 'Priya Nair', size: '0.9 MB', accepted: 0, rejected: 0, duplicates: 0,
    duration: '—', matched: 0, unmatched: 0, recon: 'Not started',
    states: ['done', 'failed', 'pending', 'pending', 'pending', 'pending'],
    insights: [
      { tone: 'rose', icon: 'pi-question-circle', title: 'Carrier could not be identified automatically', detail: 'File header did not match any known carrier template.', action: 'Assign carrier' },
      { tone: 'amber', icon: 'pi-sitemap', title: 'Mapping configuration may need adjustment', detail: 'Ingestion halted before any rows were parsed.', action: 'Configure mapping' },
    ],
  },
  {
    id: 'STM-2039', file: 'Aetna_Commissions_2026-05.xlsx', carrier: 'Aetna', period: 'May 2026',
    uploadedAt: 'Jul 08, 2026 · 11:33', status: 'Already Ingested', rows: 4610, exceptions: 0,
    uploadedBy: 'Obaid Khan', size: '2.3 MB', accepted: 4610, rejected: 0, duplicates: 4610,
    duration: '—', matched: 4610, unmatched: 0, recon: 'Previously reconciled',
    states: ['done', 'done', 'done', 'done', 'done', 'done'],
    insights: [
      { tone: 'violet', icon: 'pi-clone', title: 'This file appears to have been uploaded previously', detail: 'An identical statement was ingested on Jun 08, 2026 (STM-1998).', action: 'View original' },
    ],
  },
]

function SoStatusBadge({ status }) {
  const s = SO_STATUS[status] || SO_STATUS.Processing
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ring-1 ${s.chip}`}>
      <Icon name={s.icon} className="text-[10px]" />
      {status}
    </span>
  )
}

function SoInfoRow({ label, value, tone = 'text-slate-700' }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-[12px] text-slate-400">{label}</span>
      <span className={`text-[12.5px] font-semibold ${tone}`}>{value}</span>
    </div>
  )
}

function SoPipeline({ states }) {
  return (
    <div className="flex items-start">
      {SO_STAGES.map((stage, i) => {
        const state = states[i] || 'pending'
        const t = SO_STAGE_TONE[state]
        const iconName = t.icon || SO_STAGE_ICONS[i]
        return (
          <Fragment key={stage}>
            <div className="flex w-full min-w-0 flex-col items-center text-center">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl border ${t.ring}`}>
                <Icon name={iconName} className="text-[15px]" />
              </span>
              <span className={`mt-2 truncate text-[11.5px] font-semibold ${t.label}`}>{stage}</span>
              <span className={`mt-0.5 text-[10.5px] font-medium ${t.badge}`}>{t.badgeText}</span>
            </div>
            {i < SO_STAGES.length - 1 && (
              <div className={`mt-5 h-0.5 flex-1 rounded-full ${SO_STAGE_TONE[states[i] === 'done' ? 'done' : 'pending'].line}`} />
            )}
          </Fragment>
        )
      })}
    </div>
  )
}

const SO_QUICK_ACTIONS = [
  { key: 'details', icon: 'pi-info-circle', label: 'View details' },
  { key: 'recon', icon: 'pi-check-square', label: 'Open reconciliation', to: 'Commission Ledger' },
  { key: 'exceptions', icon: 'pi-flag', label: 'Open exception queue' },
  { key: 'log', icon: 'pi-download', label: 'Download processing log' },
  { key: 'reprocess', icon: 'pi-refresh', label: 'Reprocess file' },
  { key: 'archive', icon: 'pi-inbox', label: 'Archive upload' },
]

const SO_INSIGHT_TONES = {
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
  blue: 'bg-blue-50 text-blue-600',
  violet: 'bg-violet-50 text-violet-600',
}

function StatementUpload({ onNavigate = () => {} }) {
  const [uploads] = useState(SO_UPLOADS)
  const [selectedId, setSelectedId] = useState(SO_UPLOADS[0].id)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [dragActive, setDragActive] = useState(false)
  const fileRef = useRef(null)

  const statusFilters = ['All', 'Processing', 'Reconciled', 'Review Required', 'Failed', 'Already Ingested']

  const filtered = uploads.filter((u) => {
    const matchesQuery =
      !query ||
      u.file.toLowerCase().includes(query.toLowerCase()) ||
      u.carrier.toLowerCase().includes(query.toLowerCase()) ||
      u.id.toLowerCase().includes(query.toLowerCase())
    const matchesStatus = statusFilter === 'All' || u.status === statusFilter
    return matchesQuery && matchesStatus
  })

  const selected = uploads.find((u) => u.id === selectedId) || null

  const cols = ['File name', 'Carrier', 'Period', 'Uploaded', 'Status', 'Rows', 'Exceptions', 'Uploaded by', '']

  return (
    <div className="mx-auto max-w-[1240px] px-7 py-6">
      <FmoCrumb title="Statement Upload" onNavigate={onNavigate} />

      {/* Header */}
      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-[22px] font-bold tracking-tight text-slate-900">Statement operations</h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Upload, validate, process, and reconcile carrier commission statements while monitoring
            ingestion health and exceptions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('Command centre')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50"
          >
            <Icon name="pi-list" className="text-[12px]" />
            View processing logs
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50">
            <Icon name="pi-download" className="text-[12px]" />
            Download template
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-indigo-700"
          >
            <Icon name="pi-cloud-upload" className="text-[12px]" />
            Upload statement
          </button>
        </div>
      </div>

      {/* Upload card (compact) */}
      <CcCard className="mt-5 p-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <label
            onDragOver={(e) => {
              e.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragActive(false)
            }}
            className={`group flex cursor-pointer items-center gap-4 rounded-xl border border-dashed px-5 py-4 transition-colors lg:col-span-2 ${
              dragActive ? 'border-indigo-400 bg-indigo-50/60' : 'border-slate-300 bg-slate-50/50 hover:border-indigo-300 hover:bg-indigo-50/40'
            }`}
          >
            <input ref={fileRef} type="file" accept=".csv,.xlsx" className="hidden" />
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Icon name="pi-cloud-upload" className="text-[20px]" />
            </span>
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-slate-800">
                Drag &amp; drop your statement here
              </div>
              <div className="mt-0.5 text-[12px] text-slate-500">
                or{' '}
                <span className="font-semibold text-indigo-600 group-hover:text-indigo-700">browse files</span>{' '}
                — CSV or XLSX, up to 50 MB
              </div>
            </div>
          </label>
          <div className="rounded-xl bg-slate-50/70 px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">
              Upload guidelines
            </div>
            <ul className="mt-2 space-y-1.5">
              {[
                'Use the latest carrier template',
                'One statement period per file',
                'Include carrier & period in filename',
              ].map((g) => (
                <li key={g} className="flex items-center gap-2 text-[12px] text-slate-600">
                  <Icon name="pi-check-circle" className="text-[11px] text-emerald-500" />
                  {g}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CcCard>

      {/* KPI row */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {SO_KPIS.map((k) => (
          <CcCard key={k.key} className="p-4">
            <div className="flex items-center justify-between">
              <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${SO_KPI_TONES[k.tone]}`}>
                <Icon name={k.icon} className="text-[14px]" />
              </span>
              <CcDelta delta={k.delta} up={k.up} />
            </div>
            <div className="mt-3 truncate text-[12px] font-semibold text-slate-600">{k.label}</div>
            <div className="mt-1 text-[24px] font-bold leading-none tracking-tight text-slate-900">
              {k.value}
            </div>
            <div className="mt-1.5 truncate text-[11px] text-slate-400">{k.context}</div>
          </CcCard>
        ))}
      </div>

      {/* Main grid: recent uploads + AI insights */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recent uploads */}
        <div className="lg:col-span-2">
          <CcCard className="overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 px-4 py-3">
              <h2 className="text-[14px] font-semibold text-slate-900">Recent uploads</h2>
              <div className="relative ml-auto w-56 max-w-full">
                <Icon name="pi-search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search files, carriers…"
                  className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-[13px] text-slate-600 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
                />
              </div>
              <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">
                <Icon name="pi-refresh" className="text-[14px]" />
              </button>
            </div>

            {/* Filter chips + bulk actions */}
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-4 py-2.5">
              {statusFilters.map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors ${
                    statusFilter === f
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {f}
                </button>
              ))}
              <button className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12px] font-semibold text-slate-500 hover:bg-slate-50">
                <Icon name="pi-check-square" className="text-[11px]" />
                Bulk actions
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px]">
                <thead>
                  <tr className="border-y border-slate-100 bg-slate-50/60">
                    {cols.map((c, i) => (
                      <Th key={c || i} sort={!!c && i < 7} align={i === 5 || i === 6 ? 'right' : 'left'}>
                        {c}
                      </Th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={cols.length} className="py-16 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                          <Icon name="pi-inbox" className="text-[20px]" />
                        </div>
                        <div className="mt-3 text-[13px] font-semibold text-slate-600">No matching statements</div>
                        <div className="mt-1 text-[12px] text-slate-400">Try a different search or filter.</div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((u) => {
                      const active = u.id === selectedId
                      return (
                        <tr
                          key={u.id}
                          onClick={() => setSelectedId(u.id)}
                          className={`cursor-pointer border-b border-slate-50 transition-colors ${
                            active ? 'bg-indigo-50/50' : 'hover:bg-slate-50/70'
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                <Icon name={u.file.endsWith('.csv') ? 'pi-file' : 'pi-file-excel'} className="text-[13px]" />
                              </span>
                              <div className="min-w-0">
                                <div className="truncate text-[12.5px] font-semibold text-slate-800">{u.file}</div>
                                <div className="text-[11px] text-slate-400">{u.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[12.5px] text-slate-600">{u.carrier}</td>
                          <td className="px-4 py-3 text-[12.5px] text-slate-600">{u.period}</td>
                          <td className="px-4 py-3 text-[12px] text-slate-500">{u.uploadedAt}</td>
                          <td className="px-4 py-3"><SoStatusBadge status={u.status} /></td>
                          <td className="px-4 py-3 text-right text-[12.5px] tabular-nums text-slate-700">
                            {u.rows.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`text-[12.5px] font-semibold tabular-nums ${u.exceptions > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              {u.exceptions}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[12px] text-slate-500">{u.uploadedBy}</td>
                          <td className="px-4 py-3 text-right">
                            <RowMenuButton />
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-100">
              <TableFooter showing={`Showing ${filtered.length} of ${uploads.length}`} />
            </div>
          </CcCard>
        </div>

        {/* AI insights */}
        <div className="lg:col-span-1">
          <CcCard className="h-full p-5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
                <Icon name="pi-sparkles" className="text-[14px]" />
              </span>
              <div>
                <h2 className="text-[14px] font-semibold text-slate-900">AI upload insights</h2>
                <p className="text-[11px] text-slate-400">
                  {selected ? selected.file : 'Select a statement'}
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2.5">
              {selected && selected.insights.length > 0 ? (
                selected.insights.map((ins, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                    <div className="flex items-start gap-2.5">
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${SO_INSIGHT_TONES[ins.tone]}`}>
                        <Icon name={ins.icon} className="text-[12px]" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-[12.5px] font-semibold text-slate-800">{ins.title}</div>
                        <div className="mt-0.5 text-[11.5px] leading-relaxed text-slate-500">{ins.detail}</div>
                        <button className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-semibold text-indigo-600 hover:text-indigo-700">
                          {ins.action}
                          <Icon name="pi-arrow-right" className="text-[9px]" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[12px] text-slate-400">No insights for this statement.</p>
              )}
            </div>
          </CcCard>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <CcCard className="mt-4 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <Icon name={selected.file.endsWith('.csv') ? 'pi-file' : 'pi-file-excel'} className="text-[15px]" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[15px] font-semibold text-slate-900">{selected.file}</h2>
                  <SoStatusBadge status={selected.status} />
                </div>
                <div className="text-[12px] text-slate-400">
                  {selected.id} · {selected.carrier} · {selected.period}
                </div>
              </div>
            </div>
          </div>

          {/* Pipeline */}
          <div className="border-b border-slate-100 px-6 py-6">
            <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">
              Processing pipeline
            </div>
            <SoPipeline states={selected.states} />
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 gap-px bg-slate-100 md:grid-cols-3">
            <div className="bg-white px-6 py-5">
              <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-slate-700">
                <Icon name="pi-file" className="text-[12px] text-slate-400" />
                File information
              </div>
              <SoInfoRow label="Carrier" value={selected.carrier} />
              <SoInfoRow label="Statement period" value={selected.period} />
              <SoInfoRow label="Upload date" value={selected.uploadedAt} />
              <SoInfoRow label="Uploaded by" value={selected.uploadedBy} />
              <SoInfoRow label="File size" value={selected.size} />
            </div>
            <div className="bg-white px-6 py-5">
              <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-slate-700">
                <Icon name="pi-cog" className="text-[12px] text-slate-400" />
                Processing information
              </div>
              <SoInfoRow label="Rows processed" value={selected.rows.toLocaleString()} />
              <SoInfoRow label="Rows accepted" value={selected.accepted.toLocaleString()} tone="text-emerald-600" />
              <SoInfoRow label="Rows rejected" value={selected.rejected.toLocaleString()} tone={selected.rejected > 0 ? 'text-rose-600' : 'text-slate-700'} />
              <SoInfoRow label="Duplicate records" value={selected.duplicates.toLocaleString()} />
              <SoInfoRow label="Processing duration" value={selected.duration} />
            </div>
            <div className="bg-white px-6 py-5">
              <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-slate-700">
                <Icon name="pi-check-square" className="text-[12px] text-slate-400" />
                Reconciliation information
              </div>
              <SoInfoRow label="Matched records" value={selected.matched.toLocaleString()} tone="text-emerald-600" />
              <SoInfoRow label="Unmatched records" value={selected.unmatched.toLocaleString()} tone={selected.unmatched > 0 ? 'text-amber-600' : 'text-slate-700'} />
              <SoInfoRow label="Exceptions generated" value={selected.exceptions} tone={selected.exceptions > 0 ? 'text-rose-600' : 'text-slate-700'} />
              <SoInfoRow label="Reconciliation status" value={selected.recon} />
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/40 px-5 py-3.5">
            <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">
              Quick actions
            </span>
            {SO_QUICK_ACTIONS.map((a) => (
              <button
                key={a.key}
                onClick={() => a.to && onNavigate(a.to)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700"
              >
                <Icon name={a.icon} className="text-[11px]" />
                {a.label}
              </button>
            ))}
          </div>
        </CcCard>
      )}
    </div>
  )
}

const COPILOT_TONES = {
  indigo: 'bg-indigo-50 text-indigo-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
  blue: 'bg-blue-50 text-blue-600',
  emerald: 'bg-emerald-50 text-emerald-600',
}

const COPILOT_ACTIONS = [
  {
    key: 'commissions',
    icon: 'pi-dollar',
    title: 'Commissions',
    desc: 'Analyze payouts, accruals, balances, and trends.',
    prompts: [
      'Show unpaid commissions above $1,000',
      'Compare commission payouts this month vs last month',
      'Identify commission anomalies',
      'Top earning agencies',
      'Export commission report',
    ],
  },
  {
    key: 'reconciliation',
    icon: 'pi-sync',
    title: 'Reconciliation',
    desc: 'Identify mismatches, missing records, and reconciliation failures.',
    prompts: [
      'Find reconciliation discrepancies from the last 30 days',
      'Show unmatched carrier records',
      'Summarize missing statements',
      'Reconciliation failure trends',
      'Export reconciliation report',
    ],
  },
  {
    key: 'payroll',
    icon: 'pi-money-bill',
    title: 'Payroll',
    desc: 'Generate payroll reports, variance analysis, and exception reviews.',
    prompts: [
      'Generate payroll variance report for June',
      'Show payroll exceptions requiring review',
      'Compare the last two payroll runs',
      'List pending payroll approvals',
      'Export payroll report',
    ],
  },
  {
    key: 'renewals',
    icon: 'pi-refresh',
    title: 'Renewals',
    desc: 'Monitor upcoming renewals and retention opportunities.',
    prompts: [
      'Renewals expiring this week',
      'Renewal risk analysis',
      'Retention opportunities',
      'Renewal revenue forecast',
      'Renewal pipeline summary',
    ],
  },
  {
    key: 'agents',
    icon: 'pi-users',
    title: 'Agent Performance',
    desc: 'Evaluate top performers, lagging producers, and growth trends.',
    prompts: [
      'Show top 10 performing agents',
      'Identify lagging producers',
      'Agent growth trends',
      'Identify agencies with declining revenue',
      'Export agent scorecard',
    ],
  },
  {
    key: 'reports',
    icon: 'pi-chart-line',
    title: 'Reports & Analytics',
    desc: 'Generate operational summaries and business insights.',
    prompts: [
      'Summarize operational exceptions this week',
      'Generate a monthly business summary',
      'Compare month-over-month KPIs',
      'Show open disputes requiring attention',
      'Export monthly commission report',
    ],
  },
]

const COPILOT_DEFAULT_PROMPTS = [
  'Show unpaid commissions above $1,000',
  'Compare commission payouts this month vs last month',
  'Find reconciliation discrepancies from the last 30 days',
  'Generate payroll variance report for June',
  'Show top 10 performing agents',
  'Identify agencies with declining revenue',
]

const COPILOT_FEED = [
  { icon: 'pi-star-fill', tone: 'indigo', text: 'Commission payouts increased by 12% compared to last month.' },
  { icon: 'pi-exclamation-triangle', tone: 'amber', text: '15 reconciliation records require attention.' },
  { icon: 'pi-chart-line', tone: 'emerald', text: 'Agency XYZ has exceeded performance targets.' },
  { icon: 'pi-refresh', tone: 'blue', text: '27 renewals expire within the next 7 days.' },
  { icon: 'pi-dollar', tone: 'rose', text: '₹1.2M commissions pending approval.' },
]

function CopilotKpi({ label, value, delta }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-400">{label}</div>
      <div className="mt-1 text-[18px] font-bold text-slate-900">{value}</div>
      {delta && <div className="mt-0.5 text-[11px] font-semibold text-emerald-600">{delta}</div>}
    </div>
  )
}

function FmoAssistant({ onNavigate }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hello 👋 I'm your AI Operations Copilot. I can help analyze commissions, payroll, reconciliation, renewals, disputes, agents, and reports using your live data.",
    },
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [feedOpen, setFeedOpen] = useState(true)
  const [selectedAction, setSelectedAction] = useState(null)
  const scrollerRef = useRef(null)

  const activeAction = COPILOT_ACTIONS.find((a) => a.key === selectedAction)
  const activePrompts = activeAction ? activeAction.prompts : COPILOT_DEFAULT_PROMPTS

  const send = (text) => {
    const q = (text ?? input).trim()
    if (!q) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text: q }])
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: `Here's what I found in your live data for “${q}”:`,
          kpis: [
            { label: 'Total', value: '₹1.24M', delta: '+12% MoM' },
            { label: 'Records', value: '1,284' },
            { label: 'Flagged', value: '15' },
          ],
        },
      ])
    }, 700)
  }

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])

  return (
    <div className="mx-auto max-w-[1240px] px-7 py-6">
      {/* Title */}
      <div>
        <h1 className="text-[22px] font-bold tracking-tight text-slate-900">AI Operations Copilot</h1>
        <p className="mt-1 max-w-2xl text-[13px] text-slate-500">
          Analyze commissions, reconciliation, payroll, renewals, disputes, and operational
          performance using your live business data.
        </p>
      </div>

      {/* Suggested actions — capabilities (compact) */}
      <div className="mt-5">
        <h2 className="text-[13px] font-semibold text-slate-700">Suggested actions</h2>
        <p className="mt-0.5 text-[12px] text-slate-400">
          What the copilot can do — pick a domain to see focused prompts.
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {COPILOT_ACTIONS.map((a) => {
            const on = a.key === selectedAction
            return (
              <button
                key={a.key}
                title={a.desc}
                onClick={() => setSelectedAction(on ? null : a.key)}
                className={`flex items-center gap-2 rounded-xl border py-2.5 pl-3 pr-5 text-left transition-all ${
                  on
                    ? 'border-indigo-300 bg-indigo-50/60 ring-1 ring-indigo-200'
                    : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/40'
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    on ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'
                  }`}
                >
                  <Icon name={a.icon} className="text-[13px]" />
                </span>
                <span className={`whitespace-nowrap text-[12.5px] font-semibold ${on ? 'text-indigo-700' : 'text-slate-800'}`}>
                  {a.title}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Suggested prompts — specific queries (dynamic to selected action) */}
      <div className="mt-6">
        <div className="flex items-center gap-2">
          <h2 className="text-[13px] font-semibold text-slate-700">Suggested prompts</h2>
          {activeAction && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
              {activeAction.title}
              <button onClick={() => setSelectedAction(null)} aria-label="Clear">
                <Icon name="pi-times" className="text-[9px]" />
              </button>
            </span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {activePrompts.map((p) => (
            <button
              key={p}
              onClick={() => send(p)}
              className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[12.5px] font-medium text-slate-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chat + insights feed */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Conversation */}
        <div className="lg:col-span-2 flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div ref={scrollerRef} className="scroll-thin max-h-[420px] min-h-[280px] space-y-5 overflow-y-auto p-5">
            {messages.map((m, i) =>
              m.role === 'assistant' ? (
                <div key={i} className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                    <Icon name="pi-sparkles" className="text-[13px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="inline-block rounded-2xl rounded-tl-sm bg-slate-50 px-4 py-2.5 text-[13px] leading-relaxed text-slate-700 ring-1 ring-slate-100">
                      {m.text}
                    </div>
                    {m.kpis && (
                      <>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {m.kpis.map((k) => (
                            <CopilotKpi key={k.label} {...k} />
                          ))}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {['Download CSV', 'Export report', 'Create task', 'Share analysis'].map((b) => (
                            <button
                              key={b}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                            >
                              {b}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                    <div className="mt-1 text-[11px] text-slate-400">Just now</div>
                  </div>
                </div>
              ) : (
                <div key={i} className="flex justify-end gap-3">
                  <div className="max-w-[80%]">
                    <div className="rounded-2xl rounded-tr-sm bg-indigo-600 px-4 py-2.5 text-[13px] leading-relaxed text-white">
                      {m.text}
                    </div>
                    <div className="mt-1 text-right text-[11px] text-slate-400">Just now</div>
                  </div>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[11px] font-semibold text-white">
                    GC
                  </span>
                </div>
              ),
            )}
            {typing && (
              <div className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                  <Icon name="pi-sparkles" className="text-[13px]" />
                </span>
                <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                </div>
              </div>
            )}
          </div>

          {/* Smart input */}
          <div className="border-t border-slate-100 p-3">
            <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-indigo-100">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
                rows={2}
                placeholder="Ask about commissions, payroll, renewals, reports, agents, or business performance..."
                className="w-full resize-none bg-transparent px-2 py-1.5 text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none"
              />
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1 text-slate-400">
                  {[
                    { icon: 'pi-paperclip', title: 'Upload document' },
                    { icon: 'pi-microphone', title: 'Voice input' },
                    { icon: 'pi-bolt', title: 'Quick actions' },
                    { icon: 'pi-trash', title: 'Clear conversation' },
                  ].map((b) => (
                    <button
                      key={b.icon}
                      title={b.title}
                      onClick={() =>
                        b.icon === 'pi-trash' &&
                        setMessages((m) => m.slice(0, 1))
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-slate-100 hover:text-slate-600"
                    >
                      <Icon name={b.icon} className="text-[14px]" />
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => send()}
                  disabled={!input.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Icon name="pi-send" className="text-[12px]" />
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights feed */}
        <div className="rounded-2xl border border-slate-200 bg-white">
          <button
            onClick={() => setFeedOpen((o) => !o)}
            className="flex w-full items-center justify-between px-4 py-3.5"
          >
            <span className="flex items-center gap-2 text-[14px] font-semibold text-slate-900">
              <Icon name="pi-star-fill" className="text-[13px] text-indigo-500" />
              AI insights
            </span>
            <Icon
              name="pi-chevron-down"
              className={`text-[12px] text-slate-400 transition-transform ${feedOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {feedOpen && (
            <div className="space-y-2 border-t border-slate-100 p-3">
              {COPILOT_FEED.map((f, i) => (
                <div key={i} className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${COPILOT_TONES[f.tone]}`}>
                    <Icon name={f.icon} className="text-[12px]" />
                  </span>
                  <p className="text-[12.5px] leading-relaxed text-slate-600">{f.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const CL_SUMMARY = [
  { key: 'earned', icon: 'pi-dollar', tone: 'indigo', label: 'Total earned', value: '$48,250', delta: '+18%', up: true, context: 'vs. previous period' },
  { key: 'paid', icon: 'pi-check-circle', tone: 'emerald', label: 'Paid out', value: '$39,100', delta: '+12%', up: true, context: '6 payouts' },
  { key: 'pending', icon: 'pi-clock', tone: 'amber', label: 'Pending', value: '$6,850', delta: '3 txns', up: null, context: 'awaiting payout' },
  { key: 'balance', icon: 'pi-wallet', tone: 'blue', label: 'Current balance', value: '$9,150', delta: '+$1.2K', up: true, context: 'available now' },
  { key: 'cb', icon: 'pi-replay', tone: 'rose', label: 'Chargebacks', value: '$0', delta: 'None', up: null, context: 'this period' },
]

const CL_TREND = {
  Weekly: [
    { label: 'Mon', earned: 8, paid: 6, pending: 1, balance: 2 },
    { label: 'Tue', earned: 11, paid: 9, pending: 2, balance: 3 },
    { label: 'Wed', earned: 9, paid: 7, pending: 1, balance: 2 },
    { label: 'Thu', earned: 13, paid: 10, pending: 2, balance: 4 },
    { label: 'Fri', earned: 12, paid: 9, pending: 2, balance: 5 },
  ],
  Monthly: [
    { label: 'Jan', earned: 32, paid: 26, pending: 6, balance: 6 },
    { label: 'Feb', earned: 36, paid: 30, pending: 5, balance: 11 },
    { label: 'Mar', earned: 41, paid: 33, pending: 7, balance: 12 },
    { label: 'Apr', earned: 38, paid: 31, pending: 6, balance: 9 },
    { label: 'May', earned: 44, paid: 36, pending: 7, balance: 13 },
    { label: 'Jun', earned: 48, paid: 39, pending: 7, balance: 9 },
  ],
  Quarterly: [
    { label: 'Q1', earned: 98, paid: 80, pending: 15, balance: 12 },
    { label: 'Q2', earned: 112, paid: 92, pending: 16, balance: 14 },
    { label: 'Q3', earned: 105, paid: 85, pending: 18, balance: 13 },
    { label: 'Q4', earned: 130, paid: 104, pending: 20, balance: 11 },
  ],
}

const CL_SERIES = [
  { key: 'earned', label: 'Earned', stroke: '#6366f1' },
  { key: 'paid', label: 'Paid', stroke: '#10b981' },
  { key: 'pending', label: 'Pending', stroke: '#f59e0b' },
  { key: 'balance', label: 'Balance', stroke: '#3b82f6' },
]

const CL_INSIGHTS = [
  { text: 'Commission earnings increased 18% compared to last month.', tone: 'emerald' },
  { text: 'Largest single payout this period was $4,200.', tone: 'indigo' },
  { text: '3 payouts remain pending — $6,850 awaiting release.', tone: 'amber' },
  { text: 'No chargebacks detected during the selected period.', tone: 'blue' },
  { text: 'Top contributing carrier (Aetna) generated 42% of commissions.', tone: 'violet' },
]

const CL_TXNS = [
  { date: 'Jul 1', carrier: 'Aetna', policy: 'POL-10234', desc: 'Monthly commission', type: 'Commission Earned', amount: 500, status: 'Paid', balance: 500 },
  { date: 'Jul 3', carrier: 'Cigna', policy: 'POL-10250', desc: 'Q2 volume bonus', type: 'Bonus', amount: 250, status: 'Paid', balance: 750 },
  { date: 'Jul 5', carrier: '—', policy: '—', desc: 'Payout to bank ••1234', type: 'Payout', amount: -300, status: 'Paid', balance: 450 },
  { date: 'Jul 8', carrier: 'Humana', policy: 'POL-10310', desc: 'Rate adjustment', type: 'Adjustment', amount: -40, status: 'Paid', balance: 410 },
  { date: 'Jul 10', carrier: 'Aetna', policy: 'POL-10234', desc: 'Renewal commission', type: 'Commission Earned', amount: 400, status: 'Paid', balance: 810 },
  { date: 'Jul 14', carrier: 'UnitedHealth', policy: 'POL-10402', desc: 'New policy commission', type: 'Commission Earned', amount: 620, status: 'Pending', balance: 1430 },
  { date: 'Jul 18', carrier: 'Cigna', policy: 'POL-10250', desc: 'Clawback reversal', type: 'Chargeback', amount: -180, status: 'Reversed', balance: 1250 },
  { date: 'Jul 22', carrier: '—', policy: '—', desc: 'Payout to bank ••1234', type: 'Payout', amount: -600, status: 'Pending', balance: 650 },
]

const CL_TYPE_DOT = {
  'Commission Earned': 'bg-emerald-500',
  Bonus: 'bg-blue-500',
  Adjustment: 'bg-amber-500',
  Chargeback: 'bg-rose-500',
  Payout: 'bg-indigo-500',
}

const CL_STATUS_TONES = {
  Paid: 'bg-emerald-50 text-emerald-700',
  Pending: 'bg-amber-50 text-amber-700',
  Reversed: 'bg-rose-50 text-rose-700',
}

const CL_QUICK = [
  { icon: 'pi-file-export', label: 'Export CSV' },
  { icon: 'pi-file-pdf', label: 'Download PDF' },
  { icon: 'pi-file', label: 'Generate statement' },
  { icon: 'pi-share-alt', label: 'Share ledger' },
  { icon: 'pi-sync', label: 'Run reconciliation', to: 'Reconciliation' },
  { icon: 'pi-sparkles', label: 'Open assistant', to: 'Assistant' },
]

const CL_PRESETS = ['This month', 'Last month', 'Quarter to date', 'Year to date']

const CL_RECENT = [
  { producer: 'Bob Baker', agency: 'Nexus Agency', period: 'July 2026' },
  { producer: 'Alice Nguyen', agency: 'Summit Partners', period: 'Q2 2026' },
  { producer: 'Marcus Bell', agency: 'Nexus Agency', period: 'June 2026' },
]

const CL_FILTERS = [
  { label: 'Date range', options: ['Jul 1 – Jul 31, 2026', 'Custom…'] },
  { label: 'Statement period', options: ['July 2026', 'June 2026', 'Q2 2026'] },
  { label: 'Commission status', options: ['All statuses', 'Paid', 'Pending', 'Reversed'] },
  { label: 'Carrier', options: ['All carriers', 'Aetna', 'Cigna', 'Humana', 'UnitedHealth'] },
  { label: 'Transaction type', options: ['All types', 'Commission Earned', 'Payout', 'Adjustment', 'Bonus', 'Chargeback'] },
]

function ClSelect({ label, options }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold text-slate-500">{label}</span>
      <select className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[12.5px] text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100">
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  )
}

function CommissionLedger({ onNavigate }) {
  const [range, setRange] = useState('Monthly')
  const [chartType, setChartType] = useState('Line')
  const [preset, setPreset] = useState('This month')
  const [searched, setSearched] = useState(false)
  const [producer, setProducer] = useState('')
  const canSearch = producer.trim().length > 0
  const trend = CL_TREND[range]

  // dynamic y scale (nice round multiple of 20)
  const vals = trend.flatMap((m) => [m.earned, m.paid, m.pending, m.balance])
  const yTop = Math.max(20, Math.ceil(Math.max(...vals) / 20) * 20)
  const yLabels = [1, 0.75, 0.5, 0.25, 0].map((f) => `$${Math.round(yTop * f)}K`)

  const n = trend.length
  const xOf = (i) => (n === 1 ? 50 : (i / (n - 1)) * 100)
  const yOf = (v) => 100 - (v / yTop) * 100
  const lineSeries = CL_SERIES.map((s) => {
    const pts = trend.map((m, i) => ({ x: xOf(i), y: yOf(m[s.key]) }))
    return { ...s, pts, points: pts.map((p) => `${p.x},${p.y}`).join(' ') }
  })
  const earnedArea = `0,100 ${lineSeries[0].points} 100,100`

  return (
    <div className="mx-auto max-w-[1240px] px-7 py-6">
      <FmoCrumb title="Commission Ledger" onNavigate={onNavigate} />

      {/* Header */}
      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Icon name="pi-book" className="text-[18px]" />
          </span>
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-slate-900">Commission Ledger</h1>
            <p className="mt-0.5 max-w-2xl text-[13px] text-slate-500">
              Track commission earnings, payouts, adjustments, chargebacks, and running balances for
              producers.
            </p>
          </div>
        </div>
        {searched && (
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[12.5px] font-semibold text-slate-600 transition-colors hover:bg-slate-50">
              <Icon name="pi-file-export" className="text-[13px]" />
              Export
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-indigo-700">
              <Icon name="pi-file" className="text-[13px]" />
              Generate statement
            </button>
          </div>
        )}
      </div>

      {/* Smart filter bar */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                value={producer}
                onChange={(e) => setProducer(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && canSearch && setSearched(true)}
                placeholder="Search producer…"
                className="h-9 w-56 rounded-lg border border-slate-200 pl-8 pr-3 text-[12.5px] text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              <Icon name="pi-search" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-slate-400" />
            </div>
            <div className="flex rounded-lg border border-slate-200 p-0.5">
              {CL_PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPreset(p)}
                  className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                    preset === p ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setProducer('')
                setPreset('This month')
                setSearched(false)
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-1.5 text-[12.5px] font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              <Icon name="pi-refresh" className="text-[12px]" />
              Reset filters
            </button>
            <button
              onClick={() => canSearch && setSearched(true)}
              disabled={!canSearch}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
                canSearch
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'cursor-not-allowed bg-slate-100 text-slate-400'
              }`}
            >
              <Icon name="pi-search" className="text-[12px]" />
              Search ledger
            </button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 md:grid-cols-3 lg:grid-cols-5">
          {CL_FILTERS.map((f) => (
            <ClSelect key={f.label} label={f.label} options={f.options} />
          ))}
        </div>
      </div>

      {searched ? (
        <>
      {/* Producer overview */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-[15px] font-bold text-white">
            BB
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-bold text-slate-900">Bob Baker</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Active producer
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Icon name="pi-building" className="text-[11px]" /> Nexus Agency
              </span>
              <span className="text-slate-300">·</span>
              <span>Joined Jan 2024</span>
              <span className="text-slate-300">·</span>
              <span>Last activity 3 days ago</span>
            </div>
          </div>
          <button
            onClick={() => setSearched(false)}
            className="ml-auto rounded-lg border border-slate-200 px-3 py-1.5 text-[12.5px] font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            Change producer
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {CL_SUMMARY.map((k) => (
          <CcCard key={k.key} className="p-4">
            <div className="flex items-center justify-between">
              <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${CC_KPI_TONES[k.tone]}`}>
                <Icon name={k.icon} className="text-[14px]" />
              </span>
              <CcDelta delta={k.delta} up={k.up} />
            </div>
            <div className="mt-3 truncate text-[12px] font-semibold text-slate-600">{k.label}</div>
            <div className="mt-1 text-[25px] font-bold leading-none tracking-tight text-slate-900">
              {k.value}
            </div>
            <div className="mt-1.5 truncate text-[11.5px] text-slate-400">{k.context}</div>
          </CcCard>
        ))}
      </div>

      {/* Trend + AI insights */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <CcCard className="p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Icon name="pi-chart-line" className="text-[14px]" />
              </span>
              <div>
                <h2 className="text-[15px] font-semibold text-slate-900">Commission activity</h2>
                <p className="mt-0.5 text-[12px] text-slate-400">Earned, paid, pending and balance.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-slate-200 p-0.5">
                {['Line', 'Bar'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setChartType(t)}
                    className={`rounded-md px-2 py-1 text-[12px] font-medium transition-colors ${
                      chartType === t ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex rounded-lg border border-slate-200 p-0.5">
                {['Weekly', 'Monthly', 'Quarterly'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                      range === r ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="mt-5 flex h-56 gap-3">
            <div className="flex w-10 flex-col justify-between pb-6 text-right text-[10px] font-medium text-slate-300">
              {yLabels.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            <div className="relative flex-1">
              <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`border-t ${i === 4 ? 'border-slate-200' : 'border-dashed border-slate-100'}`}
                  />
                ))}
              </div>

              {chartType === 'Line' ? (
                <>
                  <div className="absolute inset-x-0 top-0 bottom-6">
                    <svg className="h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="clEarnedFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.16" />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <polygon points={earnedArea} fill="url(#clEarnedFill)" stroke="none" />
                      {lineSeries.map((s) => (
                        <polyline
                          key={s.key}
                          points={s.points}
                          fill="none"
                          stroke={s.stroke}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          vectorEffect="non-scaling-stroke"
                        />
                      ))}
                    </svg>
                    {lineSeries.map((s) =>
                      s.pts.map((p, i) => (
                        <span
                          key={s.key + i}
                          className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white"
                          style={{ left: `${p.x}%`, top: `${p.y}%`, backgroundColor: s.stroke }}
                        />
                      )),
                    )}
                  </div>
                </>
              ) : (
                <div className="absolute inset-x-0 top-0 bottom-6 flex items-end gap-3">
                  {trend.map((m) => (
                    <div key={m.label} className="flex flex-1 items-end justify-center gap-1">
                      <div
                        className="w-3 rounded-t bg-indigo-500"
                        style={{ height: `${(m.earned / yTop) * 100}%` }}
                        title={`Earned $${m.earned}K`}
                      />
                      <div
                        className="w-3 rounded-t bg-emerald-500"
                        style={{ height: `${(m.paid / yTop) * 100}%` }}
                        title={`Paid $${m.paid}K`}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* x labels */}
              <div className="absolute inset-x-0 bottom-0 h-4">
                {trend.map((m, i) => (
                  <span
                    key={m.label}
                    className="absolute -translate-x-1/2 text-[11px] text-slate-400"
                    style={{ left: `${xOf(i)}%` }}
                  >
                    {m.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* legend */}
          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4 text-[11.5px] text-slate-500">
            {CL_SERIES.map((s) => (
              <span key={s.key} className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-3.5 rounded-full" style={{ backgroundColor: s.stroke }} />
                {s.label}
              </span>
            ))}
          </div>
        </CcCard>

        {/* AI ledger insights */}
        <CcCard className="p-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Icon name="pi-sparkles" className="text-[14px]" />
            </span>
            <h2 className="text-[15px] font-semibold text-slate-900">AI ledger insights</h2>
          </div>
          <div className="mt-3 space-y-1.5">
            {CL_INSIGHTS.map((ins, i) => (
              <button
                key={i}
                onClick={() => onNavigate('Assistant')}
                className="flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-slate-50"
              >
                <Icon name="pi-sparkles" className={`mt-0.5 text-[12px] ${CC_INSIGHT_TONES[ins.tone]}`} />
                <span className="text-[12.5px] leading-snug text-slate-600">{ins.text}</span>
              </button>
            ))}
          </div>
        </CcCard>
      </div>

      {/* Quick actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {CL_QUICK.map((q) => (
          <button
            key={q.label}
            onClick={() => q.to && onNavigate(q.to)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12.5px] font-semibold text-slate-600 transition-all hover:border-indigo-300 hover:bg-indigo-50/40 hover:text-indigo-700"
          >
            <Icon name={q.icon} className="text-[13px]" />
            {q.label}
          </button>
        ))}
      </div>

      {/* Sticky financial summary */}
      <div className="sticky top-0 z-20 -mx-7 mt-4 border-y border-slate-200 bg-white/90 px-7 py-2.5 backdrop-blur">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[12px] text-slate-500">
          <span>
            Current balance <span className="font-bold text-slate-900">$9,150</span>
          </span>
          <span>
            Pending <span className="font-bold text-amber-600">$6,850</span>
          </span>
          <span>
            Total earned <span className="font-bold text-slate-900">$48,250</span>
          </span>
          <span className="ml-auto text-slate-400">Updated 4m ago</span>
        </div>
      </div>

      {/* Ledger transaction table */}
      <CcCard className="mt-3 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5">
          <h2 className="text-[14px] font-semibold text-slate-900">Ledger transactions</h2>
          <span className="text-[12px] text-slate-400">{CL_TXNS.length} entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-[12.5px]">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/60 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-5 py-2.5 font-semibold">Date</th>
                <th className="px-3 py-2.5 font-semibold">Carrier</th>
                <th className="px-3 py-2.5 font-semibold">Policy</th>
                <th className="px-3 py-2.5 font-semibold">Description</th>
                <th className="px-3 py-2.5 font-semibold">Type</th>
                <th className="px-3 py-2.5 text-right font-semibold">Amount</th>
                <th className="px-3 py-2.5 font-semibold">Status</th>
                <th className="px-5 py-2.5 text-right font-semibold">Balance</th>
              </tr>
            </thead>
            <tbody>
              {CL_TXNS.map((t, i) => (
                <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                  <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-500">{t.date}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-700">{t.carrier}</td>
                  <td className="whitespace-nowrap px-3 py-3 font-mono text-[11.5px] text-slate-500">
                    {t.policy}
                  </td>
                  <td className="px-3 py-3 text-slate-700">{t.desc}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <span className={`h-1.5 w-1.5 rounded-full ${CL_TYPE_DOT[t.type]}`} />
                      {t.type}
                    </span>
                  </td>
                  <td
                    className={`whitespace-nowrap px-3 py-3 text-right font-semibold ${
                      t.amount >= 0 ? 'text-emerald-600' : 'text-slate-700'
                    }`}
                  >
                    {t.amount >= 0 ? '+' : '−'}${Math.abs(t.amount).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${CL_STATUS_TONES[t.status]}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right font-bold text-slate-900">
                    ${t.balance.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CcCard>
        </>
      ) : (
        <>
          {/* Recent searches */}
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <Icon name="pi-history" className="text-[14px]" />
              </span>
              <h2 className="text-[15px] font-semibold text-slate-900">Recent searches</h2>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {CL_RECENT.map((r) => (
                <button
                  key={r.producer}
                  onClick={() => {
                    setProducer(r.producer)
                    setSearched(true)
                  }}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition-all hover:border-indigo-300 hover:bg-indigo-50/40"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[12px] font-bold text-indigo-600">
                    {r.producer.split(' ').map((w) => w[0]).join('')}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold text-slate-800">
                      {r.producer}
                    </span>
                    <span className="block truncate text-[11.5px] text-slate-400">
                      {r.agency} · {r.period}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Instructional empty state */}
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
              <Icon name="pi-search" className="text-[22px]" />
            </div>
            <div className="mt-4 text-[16px] font-bold text-slate-900">
              Select a producer to view their ledger
            </div>
            <div className="mx-auto mt-1 max-w-md text-[13px] text-slate-400">
              Choose a producer and date range above, then run a search to see commission earnings,
              payouts, balances, trends, and transaction history.
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function CommissionLedgerEmpty({ onNavigate }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-14 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Icon name="pi-inbox" className="text-[20px]" />
      </div>
      <div className="mt-3 text-[15px] font-bold text-slate-900">
        No commission activity found for the selected period.
      </div>
      <div className="mt-1 text-[13px] text-slate-400">
        Try adjusting the date range, selecting another producer, or uploading commission statements.
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => onNavigate('Statement Upload')}
          className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-[12.5px] font-semibold text-white hover:bg-indigo-700"
        >
          Upload statement
        </button>
        <button
          onClick={() => onNavigate('Agents')}
          className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-[12.5px] font-semibold text-slate-600 hover:bg-slate-50"
        >
          View producers
        </button>
        <button className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-[12.5px] font-semibold text-slate-600 hover:bg-slate-50">
          Reset filters
        </button>
      </div>
    </div>
  )
}

function AgencyTag({ children, tone }) {
  const tones = {
    violet: 'bg-violet-50 text-violet-700 ring-violet-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  }
  return (
    <span
      className={`rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide ring-1 ${tones[tone] || tones.violet}`}
    >
      {children}
    </span>
  )
}

const AG_KPIS = [
  { key: 'total', icon: 'pi-building', tone: 'indigo', label: 'Total agencies', value: '7', context: 'Registered agencies' },
  { key: 'active', icon: 'pi-check-circle', tone: 'emerald', label: 'Active agencies', value: '6', context: 'Healthy & operational' },
  { key: 'agents', icon: 'pi-users', tone: 'violet', label: 'Total agents', value: '244', context: 'Across all agencies' },
  { key: 'pending', icon: 'pi-clock', tone: 'amber', label: 'Pending approvals', value: '2', context: 'Awaiting review' },
]

const AG_HEALTH_CHIPS = [
  { label: 'New this month', value: 3, tone: 'emerald', match: (a) => a.isNew },
  { label: 'Onboarding pending', value: 2, tone: 'amber', match: (a) => a.health === 'attention' },
  { label: 'Licenses expiring', value: 4, tone: 'blue', match: (a) => a.warn === 'Expiring licenses' },
  { label: 'Inactive agency', value: 1, tone: 'rose', match: (a) => a.health === 'inactive' },
  { label: 'Northstar — top revenue', trophy: true, tone: 'violet', open: 'northstar' },
]
const AG_CHIP_DOT = {
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  blue: 'bg-blue-500',
  rose: 'bg-rose-500',
  violet: 'bg-violet-500',
  indigo: 'bg-indigo-500',
}

const AG_INSIGHTS = [
  { text: '3 new agencies added this month.', tone: 'emerald' },
  { text: '2 agencies require onboarding completion.', tone: 'amber' },
  { text: '1 agency inactive for 30+ days (Vertex Direct).', tone: 'rose' },
  { text: 'Northstar generated the highest revenue this month.', tone: 'indigo' },
  { text: '4 agencies have licenses expiring soon.', tone: 'blue' },
]

const AG_TREE = [
  {
    id: 'northstar',
    name: 'Northstar Financial',
    type: 'FMO',
    health: 'healthy',
    agents: 127,
    revenue: '$245K',
    activity: '2 hours ago',
    children: [
      {
        id: 'compatible',
        name: 'Compatible MGA',
        type: 'MGA',
        health: 'healthy',
        agents: 48,
        revenue: '$98K',
        activity: '1 day ago',
        children: [
          { id: 'bright', name: 'Bright Insurance', type: 'Agency', health: 'attention', warn: 'Expiring licenses', agents: 12, revenue: '$22K', activity: '5 days ago', children: [] },
          { id: 'coastal', name: 'Coastal Advisors', type: 'Agency', health: 'healthy', isNew: true, agents: 18, revenue: '$34K', activity: '3 hours ago', children: [] },
        ],
      },
      {
        id: 'summit',
        name: 'Summit Partners',
        type: 'MGA',
        health: 'attention',
        warn: 'Missing documents',
        agents: 30,
        revenue: '$61K',
        activity: '2 days ago',
        children: [
          { id: 'peak', name: 'Peak Agency', type: 'Agency', health: 'healthy', isNew: true, agents: 9, revenue: '$15K', activity: '6 hours ago', children: [] },
        ],
      },
      { id: 'vertex', name: 'Vertex Direct', type: 'Agency', health: 'inactive', isNew: true, agents: 0, revenue: '$0', activity: '34 days ago', children: [] },
    ],
  },
]

const AG_HEALTH = {
  healthy: { label: 'Healthy', dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700' },
  attention: { label: 'Needs attention', dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700' },
  inactive: { label: 'Inactive', dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700' },
}

const AG_TYPE_TONES = {
  FMO: 'bg-violet-50 text-violet-700 ring-violet-200',
  MGA: 'bg-blue-50 text-blue-700 ring-blue-200',
  Agency: 'bg-slate-100 text-slate-600 ring-slate-200',
}

const AG_QUICK_FILTERS = ['Active', 'Inactive', 'FMO', 'MGA', 'Agency', 'Recently added']
const AG_SORTS = ['Name', 'Revenue', 'Agent count', 'Date created']
const AG_TYPE_VIEWS = ['All', 'FMOs', 'MGAs', 'Agencies']

const AG_ACTIONS = [
  { icon: 'pi-eye', label: 'View details' },
  { icon: 'pi-users', label: 'Manage agents' },
  { icon: 'pi-chart-bar', label: 'View performance' },
  { icon: 'pi-pencil', label: 'Edit agency' },
  { icon: 'pi-sitemap', label: 'View hierarchy' },
  { icon: 'pi-power-off', label: 'Deactivate agency', danger: true },
]

function agFlatten(nodes, parent, level, out) {
  nodes.forEach((nd) => {
    out.push({ ...nd, parent, level })
    if (nd.children?.length) agFlatten(nd.children, nd.name, level + 1, out)
  })
  return out
}
const AG_FLAT = agFlatten(AG_TREE, '—', 0, [])

function AgencyTypeTag({ type }) {
  return (
    <span className={`rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold ring-1 ${AG_TYPE_TONES[type]}`}>
      {type}
    </span>
  )
}

function AgencyHealth({ health }) {
  const h = AG_HEALTH[health]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${h.chip}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${h.dot}`} />
      {h.label}
    </span>
  )
}

function AgencyNode({ node, expanded, onToggle, onSelect }) {
  const hasKids = node.children?.length > 0
  const open = expanded.has(node.id)
  return (
    <div>
      <div
        className="group flex items-center gap-2 rounded-lg py-2 pr-2 transition-colors hover:bg-slate-50"
        style={{ paddingLeft: `${node.level * 24 + 4}px` }}
      >
        {hasKids ? (
          <button
            onClick={() => onToggle(node.id)}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-200/60 hover:text-slate-600"
          >
            <Icon name={open ? 'pi-chevron-down' : 'pi-chevron-right'} className="text-[11px]" />
          </button>
        ) : (
          <span className="h-5 w-5 shrink-0" />
        )}
        <button onClick={() => onSelect(node)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
          <span className={`h-2 w-2 shrink-0 rounded-full ${AG_HEALTH[node.health].dot}`} />
          <span className="truncate text-[13.5px] font-semibold text-slate-800">{node.name}</span>
          <AgencyTypeTag type={node.type} />
          {node.warn && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10.5px] font-semibold text-amber-700">
              <Icon name="pi-exclamation-triangle" className="text-[10px]" />
              {node.warn}
            </span>
          )}
        </button>
        <div className="hidden items-center gap-4 text-[12px] text-slate-500 lg:flex">
          <span className="w-16 text-right">
            <span className="font-semibold text-slate-700">{node.agents}</span> agents
          </span>
          <span className="w-14 text-right font-semibold text-slate-700">{node.revenue}</span>
          <span className="w-28 text-right text-slate-400">{node.activity}</span>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button onClick={() => onSelect(node)} title="View details" className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/60 hover:text-slate-600">
            <Icon name="pi-eye" className="text-[13px]" />
          </button>
          <button title="Manage agents" className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/60 hover:text-slate-600">
            <Icon name="pi-users" className="text-[13px]" />
          </button>
          <button title="More" className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/60 hover:text-slate-600">
            <Icon name="pi-ellipsis-h" className="text-[13px]" />
          </button>
        </div>
      </div>
      {hasKids && open && (
        <div>
          {node.children.map((c) => (
            <AgencyNode key={c.id} node={c} expanded={expanded} onToggle={onToggle} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  )
}

function AgencyDrawer({ agency, onClose, onNavigate }) {
  if (!agency) return null
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-slate-900/20" onClick={onClose} />
      <div className="absolute right-0 top-0 flex h-full w-[380px] max-w-[90vw] flex-col border-l border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-100 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-[14px] font-bold text-white">
              {agency.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
            </span>
            <div>
              <div className="text-[15px] font-bold text-slate-900">{agency.name}</div>
              <div className="mt-1 flex items-center gap-2">
                <AgencyTypeTag type={agency.type} />
                <AgencyHealth health={agency.health} />
              </div>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
            <Icon name="pi-times" className="text-[14px]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Status', AG_HEALTH[agency.health].label],
              ['Parent', agency.parent || '—'],
              ['Agents', String(agency.agents)],
              ['Revenue (MTD)', agency.revenue],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <div className="text-[11px] text-slate-400">{k}</div>
                <div className="mt-0.5 text-[13.5px] font-semibold text-slate-800">{v}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Recent activity
          </div>
          <div className="mt-2 space-y-2">
            {[
              { t: `Last active ${agency.activity}`, i: 'pi-clock' },
              { t: '2 new agents onboarded this week', i: 'pi-user-edit' },
              { t: 'Commission statement processed', i: 'pi-file' },
            ].map((a) => (
              <div key={a.t} className="flex items-center gap-2.5 text-[12.5px] text-slate-600">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <Icon name={a.i} className="text-[12px]" />
                </span>
                {a.t}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-100 p-4">
          <div className="grid grid-cols-2 gap-2">
            {AG_ACTIONS.map((a) => (
              <button
                key={a.label}
                onClick={() => a.label === 'Manage agents' && onNavigate('Agents')}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-[12px] font-semibold transition-colors ${
                  a.danger
                    ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon name={a.icon} className="text-[12px]" />
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function AgenciesPage({ onNavigate }) {
  const [view, setView] = useState('Hierarchy')
  const [quick, setQuick] = useState(null)
  const [sort, setSort] = useState('Name')
  const [typeView, setTypeView] = useState('All')
  const [alert, setAlert] = useState(null)
  const [expanded, setExpanded] = useState(() => new Set(AG_FLAT.map((a) => a.id)))
  const [detail, setDetail] = useState(null)

  const dist = {
    roots: AG_FLAT.filter((a) => a.type === 'FMO').length,
    mgas: AG_FLAT.filter((a) => a.type === 'MGA').length,
    agencies: AG_FLAT.filter((a) => a.type === 'Agency').length,
  }
  const activeChip = AG_HEALTH_CHIPS.find((c) => c.label === alert)
  const flatList = activeChip?.match ? AG_FLAT.filter(activeChip.match) : AG_FLAT

  const toggle = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  const expandAll = () => setExpanded(new Set(AG_FLAT.map((a) => a.id)))
  const collapseAll = () => setExpanded(new Set())

  const typeFilterFlat =
    typeView === 'All'
      ? null
      : AG_FLAT.filter((a) => a.type === typeView.replace(/s$/, ''))

  if (detail) {
    return <AgencyDetail agency={detail} onBack={() => setDetail(null)} onNavigate={onNavigate} />
  }

  return (
    <div className="mx-auto max-w-[1240px] px-7 py-6">
      <FmoCrumb title="Agencies" onNavigate={onNavigate} />

      {/* Header */}
      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Icon name="pi-sitemap" className="text-[18px]" />
          </span>
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-slate-900">Agencies</h1>
            <p className="mt-0.5 max-w-2xl text-[13px] text-slate-500">
              Manage your distribution hierarchy — structure, health, growth, and operational status
              across every agency.
            </p>
          </div>
        </div>
        <button className="flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-indigo-700">
          <Icon name="pi-plus" className="text-[12px]" />
          Register agency
        </button>
      </div>

      {/* Executive summary */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {AG_KPIS.map((k) => (
          <CcCard key={k.key} className="p-4">
            <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${CC_KPI_TONES[k.tone]}`}>
              <Icon name={k.icon} className="text-[14px]" />
            </span>
            <div className="mt-3 text-[24px] font-bold leading-none tracking-tight text-slate-900">
              {k.value}
            </div>
            <div className="mt-2 text-[12px] font-semibold text-slate-600">{k.label}</div>
            <div className="mt-0.5 truncate text-[11px] text-slate-400">{k.context}</div>
          </CcCard>
        ))}
      </div>

      {/* Agency health chips */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="mr-1 inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-500">
          <Icon name="pi-bolt" className="text-[12px] text-indigo-500" /> Health &amp; attention
        </span>
        {AG_HEALTH_CHIPS.map((c) => {
          const on = alert === c.label
          return (
            <button
              key={c.label}
              onClick={() => {
                if (c.open) {
                  setDetail(AG_FLAT.find((a) => a.id === c.open))
                  return
                }
                const next = on ? null : c.label
                setAlert(next)
                if (next) setView('Table')
              }}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                on ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {c.trophy ? (
                <Icon name="pi-star-fill" className="text-[11px] text-violet-500" />
              ) : (
                <span className={`h-2 w-2 rounded-full ${AG_CHIP_DOT[c.tone]}`} />
              )}
              {c.value != null && <span className="font-bold text-slate-900">{c.value}</span>}
              {c.label}
            </button>
          )
        })}
        {alert && (
          <button onClick={() => setAlert(null)} className="text-[12px] font-semibold text-indigo-600 hover:text-indigo-700">
            Clear
          </button>
        )}
      </div>


      {/* Filter + view bar */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative">
            <input
              placeholder="Search agencies…"
              className="h-9 w-64 rounded-lg border border-slate-200 pl-8 pr-3 text-[12.5px] text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
            <Icon name="pi-search" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-slate-400" />
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-[12px] text-slate-500">
              <Icon name="pi-sort-alt" className="text-[12px]" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] font-medium text-slate-700 focus:border-indigo-400 focus:outline-none"
              >
                {AG_SORTS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <div className="flex rounded-lg border border-slate-200 p-0.5">
              {[
                ['Hierarchy', 'pi-sitemap'],
                ['Table', 'pi-list'],
                ['Card', 'pi-th-large'],
              ].map(([v, icon]) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  title={v}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                    view === v ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Icon name={icon} className="text-[12px]" />
                  <span className="hidden sm:inline">{v}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            {AG_QUICK_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setQuick(quick === f ? null : f)}
                className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
                  quick === f
                    ? 'bg-indigo-600 text-white'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-[11.5px] text-slate-500">
            <span className="rounded-md bg-violet-50 px-2 py-0.5 font-semibold text-violet-700">{dist.roots} Tenant root</span>
            <span className="rounded-md bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">{dist.mgas} MGAs</span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">{dist.agencies} Agencies</span>
          </div>
        </div>
      </div>

      {/* Content */}
      {view === 'Hierarchy' && (
        <CcCard className="mt-4 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-1.5">
              <button onClick={expandAll} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[12px] font-semibold text-slate-600 hover:bg-slate-50">
                <Icon name="pi-angle-double-down" className="text-[11px]" /> Expand all
              </button>
              <button onClick={collapseAll} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[12px] font-semibold text-slate-600 hover:bg-slate-50">
                <Icon name="pi-angle-double-up" className="text-[11px]" /> Collapse all
              </button>
            </div>
            <div className="flex rounded-lg border border-slate-200 p-0.5">
              {AG_TYPE_VIEWS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeView(t)}
                  className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                    typeView === t ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t === 'All' ? 'All' : `${t} only`}
                </button>
              ))}
            </div>
          </div>
          <div className="p-2">
            {typeFilterFlat
              ? typeFilterFlat.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setDetail(a)}
                    className="group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-slate-50"
                  >
                    <span className={`h-2 w-2 shrink-0 rounded-full ${AG_HEALTH[a.health].dot}`} />
                    <span className="truncate text-[13.5px] font-semibold text-slate-800">{a.name}</span>
                    <AgencyTypeTag type={a.type} />
                    <span className="ml-auto text-[12px] text-slate-400">{a.parent}</span>
                  </button>
                ))
              : AG_TREE.map((n) => (
                  <AgencyNode key={n.id} node={n} expanded={expanded} onToggle={toggle} onSelect={setDetail} />
                ))}
          </div>
        </CcCard>
      )}

      {view === 'Table' && (
        <CcCard className="mt-4 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-[12.5px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-2.5">Agency</th>
                  <th className="px-3 py-2.5">Type</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5 text-right">Agents</th>
                  <th className="px-3 py-2.5 text-right">Revenue</th>
                  <th className="px-3 py-2.5">Parent</th>
                  <th className="px-5 py-2.5">Last activity</th>
                </tr>
              </thead>
              <tbody>
                {flatList.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => setDetail(a)}
                    className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
                  >
                    <td className="px-5 py-3 font-semibold text-slate-800">{a.name}</td>
                    <td className="px-3 py-3"><AgencyTypeTag type={a.type} /></td>
                    <td className="px-3 py-3"><AgencyHealth health={a.health} /></td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-700">{a.agents}</td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-700">{a.revenue}</td>
                    <td className="px-3 py-3 text-slate-500">{a.parent}</td>
                    <td className="px-5 py-3 text-slate-400">{a.activity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CcCard>
      )}

      {view === 'Card' && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {flatList.map((a) => (
            <CcCard key={a.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-[12px] font-bold text-indigo-600">
                    {a.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                  </span>
                  <div>
                    <div className="text-[13.5px] font-bold text-slate-900">{a.name}</div>
                    <div className="mt-0.5"><AgencyTypeTag type={a.type} /></div>
                  </div>
                </div>
                <AgencyHealth health={a.health} />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
                <div>
                  <div className="text-[15px] font-bold text-slate-900">{a.agents}</div>
                  <div className="text-[11px] text-slate-400">Agents</div>
                </div>
                <div>
                  <div className="text-[15px] font-bold text-slate-900">{a.revenue}</div>
                  <div className="text-[11px] text-slate-400">Revenue</div>
                </div>
                <div>
                  <div className="text-[15px] font-bold text-slate-900">{a.level + 1}</div>
                  <div className="text-[11px] text-slate-400">Level</div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11.5px] text-slate-400">Active {a.activity}</span>
                <button
                  onClick={() => setDetail(a)}
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  View details <Icon name="pi-arrow-right" className="text-[9px]" />
                </button>
              </div>
            </CcCard>
          ))}
        </div>
      )}

    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Agency detail                                                      */
/* ------------------------------------------------------------------ */

const AGD_HEALTH_UI = {
  healthy: { label: 'Healthy', tone: 'emerald', icon: 'pi-check-circle' },
  attention: { label: 'Needs attention', tone: 'amber', icon: 'pi-exclamation-triangle' },
  inactive: { label: 'Critical', tone: 'rose', icon: 'pi-exclamation-circle' },
}
const AGD_HEALTH_TONE = {
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  rose: 'bg-rose-50 text-rose-700 ring-rose-100',
}
const AGD_HEALTH_FACTORS = {
  healthy: [
    { label: 'Agent activity', state: 'good', note: 'Most agents active this week' },
    { label: 'Revenue trend', state: 'good', note: 'Up 9% month over month' },
    { label: 'Documents', state: 'good', note: 'All required docs on file' },
    { label: 'Licenses', state: 'good', note: 'No expirations in 60 days' },
  ],
  attention: [
    { label: 'Agent activity', state: 'good', note: 'Activity steady' },
    { label: 'Revenue trend', state: 'warn', note: 'Growth slowing' },
    { label: 'Documents', state: 'warn', note: 'Missing documents' },
    { label: 'Licenses', state: 'warn', note: 'Expiring licenses' },
  ],
  inactive: [
    { label: 'Agent activity', state: 'bad', note: 'No production in 30+ days' },
    { label: 'Revenue trend', state: 'bad', note: 'No revenue this period' },
    { label: 'Documents', state: 'warn', note: 'Review required' },
    { label: 'Licenses', state: 'warn', note: 'Verify standing' },
  ],
}
const AGD_HEALTH_REC = {
  healthy: 'All key metrics are healthy. Keep monitoring agent activity and renewals.',
  attention: 'Resolve expiring licenses and upload missing documents to restore full health.',
  inactive: 'No production in 30+ days. Re-engage the agency or begin deactivation.',
}
const AGD_FACTOR_DOT = { good: 'bg-emerald-500', warn: 'bg-amber-500', bad: 'bg-rose-500' }

const AGD_AGENTS = [
  { name: 'Marcus Bell', status: 'Active', revenue: '$42K', comm: '$5.2K', activity: '2h ago' },
  { name: 'Priya Nair', status: 'Active', revenue: '$38K', comm: '$4.8K', activity: '1d ago' },
  { name: 'Daniel Cho', status: 'Active', revenue: '$31K', comm: '$3.9K', activity: '3h ago' },
  { name: 'Nina Owens', status: 'Inactive', revenue: '$0', comm: '$0', activity: '21d ago' },
  { name: 'Owen Frost', status: 'Active', revenue: '$27K', comm: '$3.2K', activity: '5h ago' },
]
const AGD_CARRIERS = [
  { name: 'Aetna', policies: 420, revenue: '$96K', share: 42, agents: 14 },
  { name: 'UnitedHealth', policies: 260, revenue: '$58K', share: 25, agents: 9 },
  { name: 'Cigna', policies: 180, revenue: '$41K', share: 18, agents: 6 },
  { name: 'Humana', policies: 120, revenue: '$34K', share: 15, agents: 5 },
]
const AGD_ACTIVITY = [
  { when: 'Yesterday', text: '3 agents assigned', icon: 'pi-user-edit' },
  { when: '2 days ago', text: 'Agency details updated', icon: 'pi-pencil' },
  { when: '1 week ago', text: 'New carrier relationship added', icon: 'pi-link' },
  { when: '2 weeks ago', text: 'Commission statement processed', icon: 'pi-file' },
  { when: '1 month ago', text: 'Agency onboarded', icon: 'pi-check-circle' },
]
const AGD_TABS = ['Overview', 'Agents', 'Hierarchy', 'Performance', 'Relationships', 'Activity']

const AGD_MORE = [
  { icon: 'pi-sitemap', label: 'View hierarchy', act: 'hierarchy' },
  { icon: 'pi-history', label: 'View audit history' },
  { icon: 'pi-list', label: 'View activity log', act: 'activity' },
  { icon: 'pi-download', label: 'Export agency data' },
  { icon: 'pi-file-export', label: 'Export agent list' },
  { icon: 'pi-clone', label: 'Duplicate agency' },
  { icon: 'pi-arrow-right-arrow-left', label: 'Transfer agency' },
  { icon: 'pi-code', label: 'View technical details', act: 'tech' },
]
const AGD_DANGER = [
  { icon: 'pi-power-off', label: 'Deactivate agency' },
  { icon: 'pi-inbox', label: 'Archive agency' },
  { icon: 'pi-trash', label: 'Delete agency' },
]

function agFind(nodes, id, path = []) {
  for (const n of nodes) {
    const p = [...path, n]
    if (n.id === id) return p
    if (n.children?.length) {
      const r = agFind(n.children, id, p)
      if (r) return r
    }
  }
  return null
}
function agDescendants(node) {
  let c = 0
  ;(node.children || []).forEach((ch) => {
    c += 1 + agDescendants(ch)
  })
  return c
}

function AgdSpark({ values, stroke }) {
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const n = values.length
  const pts = values.map((v, i) => ({ x: (i / (n - 1)) * 100, y: 100 - ((v - min) / range) * 90 - 5 }))
  const line = pts.map((p) => `${p.x},${p.y}`).join(' ')
  return (
    <svg className="h-12 w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polygon points={`0,100 ${line} 100,100`} style={{ fill: stroke, opacity: 0.1 }} />
      <polyline
        points={line}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

function AgdEmpty({ icon, title, desc, action, onAction }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-14 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon name={icon} className="text-[20px]" />
      </div>
      <div className="mt-3 text-[15px] font-bold text-slate-900">{title}</div>
      <div className="mx-auto mt-1 max-w-sm text-[12.5px] text-slate-400">{desc}</div>
      {action && (
        <button
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-indigo-700"
        >
          <Icon name="pi-plus" className="text-[11px]" />
          {action}
        </button>
      )}
    </div>
  )
}

function AgdHierNode({ node, expanded, onToggle }) {
  const hasKids = node.children?.length > 0
  const open = expanded.has(node.id)
  return (
    <div>
      <div
        className="flex items-center gap-2 rounded-lg py-1.5 pr-2 hover:bg-slate-50"
        style={{ paddingLeft: `${node.level * 22 + 4}px` }}
      >
        {hasKids ? (
          <button
            onClick={() => onToggle(node.id)}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-200/60"
          >
            <Icon name={open ? 'pi-chevron-down' : 'pi-chevron-right'} className="text-[11px]" />
          </button>
        ) : (
          <span className="h-5 w-5 shrink-0" />
        )}
        <span className={`h-2 w-2 shrink-0 rounded-full ${AG_HEALTH[node.health].dot}`} />
        <span className="text-[13px] font-semibold text-slate-800">{node.name}</span>
        <AgencyTypeTag type={node.type} />
        <span className="ml-auto text-[11.5px] text-slate-400">{node.agents} agents · {node.revenue}</span>
      </div>
      {hasKids && open && node.children.map((c) => (
        <AgdHierNode key={c.id} node={c} expanded={expanded} onToggle={onToggle} />
      ))}
    </div>
  )
}

function AgencyDetail({ agency, onBack, onNavigate }) {
  const [tab, setTab] = useState('Overview')
  const [techOpen, setTechOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const path = agFind(AG_TREE, agency.id) || [agency]
  const node = path[path.length - 1]
  const upline = path.slice(0, -1)
  const subCount = agDescendants(node)
  const [hExpanded, setHExpanded] = useState(() => {
    const ids = []
    const walk = (ns) => ns.forEach((x) => { ids.push(x.id); if (x.children) walk(x.children) })
    walk([node])
    return new Set(ids)
  })
  const hToggle = (id) =>
    setHExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const runMore = (item) => {
    setMenuOpen(false)
    if (item.act === 'hierarchy') setTab('Hierarchy')
    else if (item.act === 'activity') setTab('Activity')
    else if (item.act === 'tech') {
      setTab('Overview')
      setTechOpen(true)
    }
  }

  const hui = AGD_HEALTH_UI[agency.health]
  const kpis = [
    { icon: 'pi-users', tone: 'indigo', label: 'Active agents', value: String(agency.agents), delta: '+5', up: true },
    { icon: 'pi-sitemap', tone: 'blue', label: 'Sub agencies', value: String(subCount), delta: subCount ? '+1' : '0', up: subCount ? true : null },
    { icon: 'pi-dollar', tone: 'emerald', label: 'Monthly revenue', value: agency.revenue, delta: '+9%', up: true },
    { icon: 'pi-money-bill', tone: 'violet', label: 'Monthly commissions', value: '$38K', delta: '+12%', up: true },
    { icon: 'pi-refresh', tone: 'amber', label: 'Retention rate', value: '91%', delta: '+2pt', up: true },
    { icon: 'pi-chart-line', tone: 'rose', label: 'Growth', value: '14%', delta: '+3pt', up: true },
  ]
  const perf = [
    { label: 'Revenue trend', value: agency.revenue, delta: '+9%', stroke: '#6366f1', values: [32, 36, 41, 38, 44, 48] },
    { label: 'Commission trend', value: '$38K', delta: '+12%', stroke: '#10b981', values: [20, 24, 26, 25, 30, 32] },
    { label: 'Agent growth', value: String(agency.agents), delta: '+5', stroke: '#3b82f6', values: [18, 20, 22, 24, 27, 30] },
    { label: 'Retention trend', value: '91%', delta: '+2pt', stroke: '#8b5cf6', values: [86, 88, 87, 90, 89, 91] },
  ]
  const hasAgents = agency.agents > 0
  const hasKids = (node.children || []).length > 0

  return (
    <div className="mx-auto max-w-[1240px] px-7 py-6">
      {/* Top row: breadcrumb + action toolbar */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <nav className="flex items-center gap-2 text-[13px] text-slate-400">
          <button onClick={() => onNavigate('Command centre')} className="font-medium text-slate-500 hover:text-indigo-600">
            Command centre
          </button>
          <span className="text-slate-300">/</span>
          <button onClick={onBack} className="font-medium text-slate-500 hover:text-indigo-600">
            Agencies
          </button>
          <span className="text-slate-300">/</span>
          <span className="font-medium text-slate-700">{agency.name}</span>
        </nav>
        <div className="flex flex-wrap items-center gap-2">
            {/* Growth (primary CTA) */}
            <button
              title="Add new agents to this agency."
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
            >
              <Icon name="pi-user-plus" className="text-[12px]" /> Invite agent
            </button>
            <span className="mx-0.5 hidden h-6 w-px bg-slate-200 sm:block" />
            {/* Operational */}
            <button
              onClick={() => onNavigate('Agents')}
              title="Manage assigned agents and invitations."
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[12.5px] font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              <Icon name="pi-users" className="text-[12px]" /> Manage agents
            </button>
            <span className="mx-0.5 hidden h-6 w-px bg-slate-200 sm:block" />
            {/* Administrative */}
            <button
              title="Edit agency information and settings."
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[12.5px] font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              <Icon name="pi-pencil" className="text-[12px]" /> Edit
            </button>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen((o) => !o)
                }}
                title="More agency actions"
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12.5px] font-semibold transition-colors ${
                  menuOpen ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon name="pi-ellipsis-h" className="text-[12px]" /> More
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 z-40 mt-1.5 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                    {AGD_MORE.map((m) => (
                      <button
                        key={m.label}
                        onClick={() => runMore(m)}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12.5px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
                      >
                        <Icon name={m.icon} className="text-[13px] text-slate-400" />
                        {m.label}
                      </button>
                    ))}
                    <div className="my-1.5 border-t border-slate-100" />
                    <div className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wide text-rose-400">
                      Danger zone
                    </div>
                    {AGD_DANGER.map((m) => (
                      <button
                        key={m.label}
                        onClick={() => {
                          setMenuOpen(false)
                          window.confirm(`${m.label}? This action requires confirmation.`)
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12.5px] font-medium text-rose-600 transition-colors hover:bg-rose-50"
                      >
                        <Icon name={m.icon} className="text-[13px]" />
                        {m.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
      </div>

      {/* Profile header */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-[18px] font-bold text-white">
            {agency.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[20px] font-bold tracking-tight text-slate-900">{agency.name}</h1>
              <AgencyTypeTag type={agency.type} />
              <AgencyHealth health={agency.health} />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Icon name="pi-sitemap" className="text-[11px]" /> Parent:{' '}
                {agency.parent && agency.parent !== '—' ? agency.parent : 'Northstar organization'}
              </span>
              <span className="text-slate-300">·</span>
              <span>Created Jan 12, 2024</span>
              <span className="text-slate-300">·</span>
              <span>Last active {agency.activity}</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI overview */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <CcCard key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${CC_KPI_TONES[k.tone]}`}>
                <Icon name={k.icon} className="text-[14px]" />
              </span>
              <CcDelta delta={k.delta} up={k.up} />
            </div>
            <div className="mt-3 text-[20px] font-bold leading-none tracking-tight text-slate-900">{k.value}</div>
            <div className="mt-1.5 truncate text-[11.5px] font-semibold text-slate-500">{k.label}</div>
          </CcCard>
        ))}
      </div>

      {/* Tabs */}
      <div className="mt-5 flex gap-1 overflow-x-auto border-b border-slate-200">
        {AGD_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`whitespace-nowrap border-b-2 px-3.5 py-2.5 text-[13px] font-semibold transition-colors ${
              tab === t
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {tab === 'Overview' && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Health card */}
            <CcCard className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Icon name="pi-heart" className="text-[14px]" />
                  </span>
                  <h2 className="text-[15px] font-semibold text-slate-900">Agency health</h2>
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ring-1 ${AGD_HEALTH_TONE[hui.tone]}`}>
                  <Icon name={hui.icon} className="text-[12px]" />
                  {hui.label}
                </span>
              </div>
              <div className="mt-4 space-y-2">
                {AGD_HEALTH_FACTORS[agency.health].map((f) => (
                  <div key={f.label} className="flex items-center gap-2.5">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${AGD_FACTOR_DOT[f.state]}`} />
                    <span className="w-28 shrink-0 text-[12.5px] font-medium text-slate-700">{f.label}</span>
                    <span className="truncate text-[12px] text-slate-400">{f.note}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-[12px] text-slate-600">
                <Icon name="pi-lightbulb" className="mt-0.5 text-[13px] text-amber-500" />
                <span>{AGD_HEALTH_REC[agency.health]}</span>
              </div>
            </CcCard>

            {/* Overview card */}
            <CcCard className="p-5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <Icon name="pi-info-circle" className="text-[14px]" />
                </span>
                <h2 className="text-[15px] font-semibold text-slate-900">Agency overview</h2>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
                {[
                  ['Agency type', agency.type],
                  ['Parent agency', agency.parent && agency.parent !== '—' ? agency.parent : 'Northstar organization'],
                  ['Hierarchy level', `Level ${agency.level + 1}`],
                  ['Created date', 'Jan 12, 2024'],
                  ['Last updated', '2 days ago'],
                  ['Contact', 'ops@agency.com'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="text-[11px] text-slate-400">{k}</div>
                    <div className="mt-0.5 text-[13px] font-semibold text-slate-800">{v}</div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setTechOpen((o) => !o)}
                className="mt-4 flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-[12.5px] font-semibold text-slate-600 hover:bg-slate-50"
              >
                View technical details
                <Icon name={techOpen ? 'pi-chevron-up' : 'pi-chevron-down'} className="text-[11px]" />
              </button>
              {techOpen && (
                <div className="mt-2 space-y-2 rounded-lg bg-slate-50 p-3 font-mono text-[11.5px] text-slate-500">
                  <div>agency_id: {agency.id}-8f2a-4c1e-b7d9</div>
                  <div>tenant_root: 0b19-aa42-tenant</div>
                  <div>created_by: system@nexus</div>
                  <div>schema_version: v3.2</div>
                </div>
              )}
            </CcCard>

            {/* Recent activity preview */}
            <CcCard className="p-5 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-slate-900">Recent activity</h2>
                <button onClick={() => setTab('Activity')} className="text-[12px] font-semibold text-indigo-600 hover:text-indigo-700">
                  View all
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2">
                {AGD_ACTIVITY.slice(0, 3).map((a) => (
                  <div key={a.text} className="flex items-center gap-2.5 text-[12.5px] text-slate-600">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <Icon name={a.icon} className="text-[12px]" />
                    </span>
                    <span>
                      {a.text} <span className="text-slate-400">· {a.when}</span>
                    </span>
                  </div>
                ))}
              </div>
            </CcCard>
          </div>
        )}

        {tab === 'Agents' &&
          (hasAgents ? (
            <CcCard className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                <div className="relative">
                  <input
                    placeholder="Search agents…"
                    className="h-9 w-56 rounded-lg border border-slate-200 pl-8 pr-3 text-[12.5px] text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                  <Icon name="pi-search" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-slate-400" />
                </div>
                <button className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-indigo-700">
                  <Icon name="pi-user-plus" className="text-[12px]" /> Assign agent
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-[12.5px]">
                  <thead>
                    <tr className="border-y border-slate-100 bg-slate-50/60 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      <th className="px-5 py-2.5">Agent</th>
                      <th className="px-3 py-2.5">Status</th>
                      <th className="px-3 py-2.5 text-right">Revenue</th>
                      <th className="px-3 py-2.5 text-right">Commission</th>
                      <th className="px-3 py-2.5">Last activity</th>
                      <th className="px-5 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {AGD_AGENTS.map((a) => (
                      <tr key={a.name} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                        <td className="px-5 py-3 font-semibold text-slate-800">{a.name}</td>
                        <td className="px-3 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${a.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right font-semibold text-slate-700">{a.revenue}</td>
                        <td className="px-3 py-3 text-right font-semibold text-slate-700">{a.comm}</td>
                        <td className="px-3 py-3 text-slate-400">{a.activity}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-0.5">
                            <button title="View profile" className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                              <Icon name="pi-eye" className="text-[13px]" />
                            </button>
                            <button title="Remove agent" className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                              <Icon name="pi-times" className="text-[13px]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CcCard>
          ) : (
            <AgdEmpty
              icon="pi-users"
              title="No agents assigned"
              desc="This agency has no active agents yet. Assign or invite agents to start tracking production."
              action="Assign agent"
              onAction={() => onNavigate('Agents')}
            />
          ))}

        {tab === 'Hierarchy' &&
          (hasKids ? (
            <CcCard className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
                <div className="relative">
                  <input
                    placeholder="Search within hierarchy…"
                    className="h-8 w-56 rounded-lg border border-slate-200 pl-8 pr-3 text-[12px] text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
                  />
                  <Icon name="pi-search" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400" />
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setHExpanded(new Set([node.id, ...[].concat(...(function all(ns){return ns.flatMap(x=>[x.id,...all(x.children||[])])})([node]))]))} className="rounded-lg border border-slate-200 px-2.5 py-1 text-[12px] font-semibold text-slate-600 hover:bg-slate-50">
                    Expand all
                  </button>
                  <button onClick={() => setHExpanded(new Set([node.id]))} className="rounded-lg border border-slate-200 px-2.5 py-1 text-[12px] font-semibold text-slate-600 hover:bg-slate-50">
                    Collapse all
                  </button>
                  <div className="ml-1 flex items-center gap-0.5 rounded-lg border border-slate-200 p-0.5">
                    <button onClick={() => setZoom((z) => Math.max(0.7, z - 0.1))} className="flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-slate-100">
                      <Icon name="pi-minus" className="text-[11px]" />
                    </button>
                    <button onClick={() => setZoom(1)} className="px-1 text-[11px] font-semibold text-slate-500">
                      {Math.round(zoom * 100)}%
                    </button>
                    <button onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))} className="flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-slate-100">
                      <Icon name="pi-plus" className="text-[11px]" />
                    </button>
                  </div>
                </div>
              </div>
              {upline.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 bg-slate-50/50 px-4 py-2 text-[11.5px] text-slate-400">
                  <span className="font-semibold uppercase tracking-wide">Upline:</span>
                  {upline.map((u) => (
                    <span key={u.id} className="inline-flex items-center gap-1.5">
                      <span className="font-medium text-slate-600">{u.name}</span>
                      <Icon name="pi-angle-right" className="text-[10px]" />
                    </span>
                  ))}
                  <span className="font-semibold text-slate-700">{node.name}</span>
                </div>
              )}
              <div className="overflow-x-auto p-3">
                <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }} className="min-w-[520px] transition-transform">
                  <AgdHierNode node={node} expanded={hExpanded} onToggle={hToggle} />
                </div>
              </div>
            </CcCard>
          ) : (
            <AgdEmpty
              icon="pi-sitemap"
              title="No sub-agencies"
              desc="This agency sits at the bottom of its hierarchy — there are no downline nodes to display."
            />
          ))}

        {tab === 'Performance' &&
          (hasAgents ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {perf.map((p) => (
                <CcCard key={p.label} className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[12.5px] font-semibold text-slate-500">{p.label}</div>
                      <div className="mt-1 text-[22px] font-bold leading-none tracking-tight text-slate-900">{p.value}</div>
                    </div>
                    <CcDelta delta={p.delta} up={true} />
                  </div>
                  <div className="mt-3">
                    <AgdSpark values={p.values} stroke={p.stroke} />
                  </div>
                </CcCard>
              ))}
            </div>
          ) : (
            <AgdEmpty
              icon="pi-chart-line"
              title="No performance data"
              desc="Performance analytics will appear once this agency has active agents and recorded production."
            />
          ))}

        {tab === 'Relationships' &&
          (hasAgents ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {AGD_CARRIERS.map((c) => (
                <CcCard key={c.name} className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                        <Icon name="pi-building" className="text-[14px]" />
                      </span>
                      <div className="text-[14px] font-bold text-slate-900">{c.name}</div>
                    </div>
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-600">{c.share}%</span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
                    <div>
                      <div className="text-[15px] font-bold text-slate-900">{c.policies}</div>
                      <div className="text-[11px] text-slate-400">Policies</div>
                    </div>
                    <div>
                      <div className="text-[15px] font-bold text-slate-900">{c.revenue}</div>
                      <div className="text-[11px] text-slate-400">Revenue</div>
                    </div>
                    <div>
                      <div className="text-[15px] font-bold text-slate-900">{c.agents}</div>
                      <div className="text-[11px] text-slate-400">Agents</div>
                    </div>
                  </div>
                </CcCard>
              ))}
            </div>
          ) : (
            <AgdEmpty
              icon="pi-link"
              title="No relationships configured"
              desc="No carrier or principal relationships are linked to this agency yet."
              action="Add relationship"
            />
          ))}

        {tab === 'Activity' && (
          <CcCard className="p-5">
            <div className="relative ml-2 border-l border-slate-200 pl-6">
              {AGD_ACTIVITY.map((a) => (
                <div key={a.text} className="relative pb-5 last:pb-0">
                  <span className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full bg-white ring-1 ring-slate-200">
                    <Icon name={a.icon} className="text-[11px] text-slate-500" />
                  </span>
                  <div className="text-[13px] font-semibold text-slate-800">{a.text}</div>
                  <div className="mt-0.5 text-[11.5px] text-slate-400">{a.when}</div>
                </div>
              ))}
            </div>
          </CcCard>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Agent directory                                                    */
/* ------------------------------------------------------------------ */

const AD_AGENTS = [
  { id: 'david', name: 'David Diaz', role: 'Licensed Agent', npn: '200000002', email: 'david.diaz@nexus.com', agency: 'Cornerstone MGA', type: 'Individual', lifecycle: 'Active', payment: 'Eligible', compliance: 100, license: 'Active', appts: 8, joined: 'Jul 2026', activity: '2 days ago' },
  { id: 'sarah', name: 'Sarah Kim', role: 'Licensed Agent', npn: '200000045', email: 'sarah.kim@nexus.com', agency: 'Northstar Financial', type: 'Individual', lifecycle: 'Active', payment: 'Eligible', compliance: 96, license: 'Active', appts: 6, joined: 'Jun 2026', activity: 'Today' },
  { id: 'marcus', name: 'Marcus Bell', role: 'Licensed Agent', npn: '200000078', email: 'marcus.bell@nexus.com', agency: 'Cornerstone MGA', type: 'Individual', lifecycle: 'Active', payment: 'Pending', compliance: 88, license: 'Expiring', appts: 5, joined: 'May 2026', activity: '3 days ago' },
  { id: 'nina', name: 'Nina Owens', role: 'Licensed Agent', npn: '200000112', email: 'nina.owens@nexus.com', agency: 'Summit Partners', type: 'Individual', lifecycle: 'Inactive', payment: 'Blocked', compliance: 72, license: 'Expired', appts: 2, joined: 'Feb 2026', activity: '21 days ago' },
  { id: 'owen', name: 'Owen Frost', role: 'Prospect', npn: '200000133', email: 'owen.frost@nexus.com', agency: 'Coastal Advisors', type: 'Individual', lifecycle: 'Screening', payment: 'Blocked', compliance: 40, license: '—', appts: 0, joined: 'Jul 2026', activity: 'Never' },
  { id: 'priya', name: 'Priya Nair', role: 'Licensed Agent', npn: '200000090', email: 'priya.nair@nexus.com', agency: 'Northstar Financial', type: 'Individual', lifecycle: 'Active', payment: 'Eligible', compliance: 100, license: 'Active', appts: 7, joined: 'Apr 2026', activity: '1 week ago' },
]

const AD_KPIS = [
  { icon: 'pi-users', tone: 'indigo', label: 'Total agents', value: '48', context: 'Directory size' },
  { icon: 'pi-check-circle', tone: 'emerald', label: 'Active agents', value: '41', delta: '+3', up: true, context: 'this month' },
  { icon: 'pi-money-bill', tone: 'violet', label: 'Payment eligible', value: '39', context: 'Ready for payout' },
  { icon: 'pi-dollar', tone: 'teal', label: 'Monthly commissions', value: '$148K', delta: '+11%', up: true, context: 'vs last month' },
]

const AD_ALERT_DOT = {
  rose: 'bg-rose-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-500',
  slate: 'bg-slate-400',
}
const AD_ALERT_MATCH = {
  'Payment blocks': (a) => a.payment === 'Blocked',
  'Licenses expiring': (a) => a.license === 'Expiring',
  'Missing appointments': (a) => a.appts === 0,
  'Compliance issues': (a) => a.compliance < 80,
  'Inactive agents': (a) => a.lifecycle === 'Inactive',
}

const AD_ATTENTION = [
  { icon: 'pi-ban', tone: 'rose', label: 'Payment blocks', value: 3, note: 'Payouts on hold' },
  { icon: 'pi-id-card', tone: 'orange', label: 'Licenses expiring', value: 5, note: 'Within 60 days' },
  { icon: 'pi-briefcase', tone: 'yellow', label: 'Missing appointments', value: 2, note: 'Carrier gaps' },
  { icon: 'pi-exclamation-triangle', tone: 'rose', label: 'Compliance issues', value: 4, note: 'Below threshold' },
  { icon: 'pi-clock', tone: 'slate', label: 'Inactive agents', value: 3, note: 'No recent activity' },
]
const AD_ATTN_TONE = {
  rose: 'bg-rose-50 text-rose-600',
  orange: 'bg-orange-50 text-orange-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  slate: 'bg-slate-100 text-slate-500',
}

const AD_LIFECYCLE_TONE = {
  Active: 'bg-emerald-50 text-emerald-700',
  Prospect: 'bg-blue-50 text-blue-700',
  Screening: 'bg-indigo-50 text-indigo-700',
  Contracting: 'bg-violet-50 text-violet-700',
  Inactive: 'bg-slate-100 text-slate-500',
}
const AD_PAYMENT_TONE = {
  Eligible: 'bg-emerald-50 text-emerald-700',
  Pending: 'bg-amber-50 text-amber-700',
  Blocked: 'bg-rose-50 text-rose-700',
}
const AD_LICENSE_TONE = {
  Active: 'bg-emerald-50 text-emerald-700',
  Expiring: 'bg-amber-50 text-amber-700',
  Expired: 'bg-rose-50 text-rose-700',
  '—': 'bg-slate-100 text-slate-500',
}
const AD_ROW_ACTIONS = [
  { icon: 'pi-eye', label: 'View profile', act: 'view' },
  { icon: 'pi-pencil', label: 'Edit agent' },
  { icon: 'pi-id-card', label: 'Manage licenses' },
  { icon: 'pi-briefcase', label: 'Manage appointments' },
  { icon: 'pi-chart-bar', label: 'View performance' },
  { icon: 'pi-arrow-right-arrow-left', label: 'Transition status' },
  { icon: 'pi-inbox', label: 'Archive agent', danger: true },
]

function AdCompliance({ score }) {
  const tone = score >= 95 ? 'emerald' : score >= 80 ? 'amber' : 'rose'
  const bar = { emerald: 'bg-emerald-500', amber: 'bg-amber-500', rose: 'bg-rose-500' }[tone]
  const txt = { emerald: 'text-emerald-600', amber: 'text-amber-600', rose: 'text-rose-600' }[tone]
  return (
    <div className="w-24">
      <div className="flex items-center justify-between">
        <span className={`text-[12px] font-semibold ${txt}`}>{score}%</span>
        {score >= 95 && <Icon name="pi-check" className="text-[10px] text-emerald-500" />}
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

function AdBadge({ value, map }) {
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${map[value]}`}>{value}</span>
}

function AgentDirectory({ onNavigate }) {
  const [detail, setDetail] = useState(null)
  const [viewMode, setViewMode] = useState('Table')
  const [query, setQuery] = useState('')
  const [alert, setAlert] = useState(null)
  const [openRow, setOpenRow] = useState(null)

  if (detail) {
    return <AgentProfile agent={detail} onBack={() => setDetail(null)} onNavigate={onNavigate} />
  }

  const agents = AD_AGENTS.filter((a) => {
    const q = query.toLowerCase()
    const matchesQuery =
      a.name.toLowerCase().includes(q) ||
      a.npn.includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.agency.toLowerCase().includes(q)
    const matchesAlert = !alert || AD_ALERT_MATCH[alert](a)
    return matchesQuery && matchesAlert
  })

  const avatar = (name) => name.split(' ').map((w) => w[0]).slice(0, 2).join('')

  return (
    <div className="mx-auto max-w-[1240px] px-7 py-6">
      <FmoCrumb title="Agents" onNavigate={onNavigate} />

      {/* Header */}
      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Icon name="pi-users" className="text-[18px]" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-[22px] font-bold tracking-tight text-slate-900">Agents</h1>
            </div>
            <p className="mt-0.5 max-w-xl text-[13px] text-slate-500">
              Manage, onboard, monitor, and review agent performance, compliance, licensing,
              appointments, and payment eligibility.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[12.5px] font-semibold text-slate-600 hover:bg-slate-50">
            <Icon name="pi-upload" className="text-[12px]" /> Bulk import
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[12.5px] font-semibold text-slate-600 hover:bg-slate-50">
            <Icon name="pi-file-export" className="text-[12px]" /> Export
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[12.5px] font-semibold text-slate-600 hover:bg-slate-50">
            <Icon name="pi-user-plus" className="text-[12px]" /> Invite agent
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-[12.5px] font-semibold text-white hover:bg-indigo-700">
            <Icon name="pi-plus" className="text-[12px]" /> Onboard agent
          </button>
        </div>
      </div>

      {/* Executive summary */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {AD_KPIS.map((k) => (
          <CcCard key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${CC_KPI_TONES[k.tone]}`}>
                <Icon name={k.icon} className="text-[14px]" />
              </span>
              {k.delta && <CcDelta delta={k.delta} up={k.up} />}
            </div>
            <div className="mt-3 text-[24px] font-bold leading-none tracking-tight text-slate-900">{k.value}</div>
            <div className="mt-2 truncate text-[12px] font-semibold text-slate-600">{k.label}</div>
            <div className="mt-0.5 truncate text-[11px] text-slate-400">{k.context}</div>
          </CcCard>
        ))}
      </div>

      {/* Attention required chips */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="mr-1 inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-500">
          <Icon name="pi-bolt" className="text-[12px] text-indigo-500" /> Attention required
        </span>
        {AD_ATTENTION.map((a) => {
          const on = alert === a.label
          return (
            <button
              key={a.label}
              onClick={() => setAlert(on ? null : a.label)}
              title={a.note}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                on ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${AD_ALERT_DOT[a.tone]}`} />
              <span className="font-bold text-slate-900">{a.value}</span>
              {a.label}
            </button>
          )
        })}
        {alert && (
          <button onClick={() => setAlert(null)} className="text-[12px] font-semibold text-indigo-600 hover:text-indigo-700">
            Clear
          </button>
        )}
      </div>

      {/* Search + filters + view toggle */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, NPN, email or agency…"
              className="h-9 w-72 rounded-lg border border-slate-200 pl-8 pr-3 text-[12.5px] text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
            <Icon name="pi-search" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-slate-400" />
          </div>
          <div className="flex items-center gap-1.5">
            <button className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-[12px] font-semibold text-slate-600 hover:bg-slate-50">
              <Icon name="pi-bookmark" className="text-[11px]" /> Saved views
            </button>
            <button onClick={() => setQuery('')} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-[12px] font-semibold text-slate-600 hover:bg-slate-50">
              <Icon name="pi-refresh" className="text-[11px]" /> Reset
            </button>
            <div className="flex rounded-lg border border-slate-200 p-0.5">
              {[
                ['Table', 'pi-list'],
                ['Card', 'pi-th-large'],
              ].map(([v, icon]) => (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                    viewMode === v ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Icon name={icon} className="text-[12px]" />
                  <span className="hidden sm:inline">{v}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          {['Status', 'Agency', 'Agent type', 'Payment status', 'License status', 'Appointment status', 'Join date'].map((f) => (
            <button key={f} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12px] font-medium text-slate-600 hover:bg-slate-50">
              {f} <Icon name="pi-chevron-down" className="text-[9px] text-slate-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {agents.length === 0 ? (
        <AgtDirectoryEmpty onReset={() => setQuery('')} />
      ) : viewMode === 'Table' ? (
        <CcCard className="mt-4 overflow-visible">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-[12.5px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-2.5">Agent</th>
                  <th className="px-3 py-2.5">NPN</th>
                  <th className="px-3 py-2.5">Agency</th>
                  <th className="px-3 py-2.5">Lifecycle</th>
                  <th className="px-3 py-2.5">Payment</th>
                  <th className="px-3 py-2.5">Compliance</th>
                  <th className="px-3 py-2.5">Licensing</th>
                  <th className="px-3 py-2.5 text-right">Appts</th>
                  <th className="px-3 py-2.5">Last activity</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
                  <tr key={a.id} onClick={() => setDetail(a)} className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">
                          {avatar(a.name)}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-slate-800">{a.name}</div>
                          <div className="truncate text-[11px] text-slate-400">{a.role} · Joined {a.joined}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-[11.5px] text-slate-500">{a.npn}</td>
                    <td className="px-3 py-3 text-slate-600">{a.agency}</td>
                    <td className="px-3 py-3"><AdBadge value={a.lifecycle} map={AD_LIFECYCLE_TONE} /></td>
                    <td className="px-3 py-3"><AdBadge value={a.payment} map={AD_PAYMENT_TONE} /></td>
                    <td className="px-3 py-3"><AdCompliance score={a.compliance} /></td>
                    <td className="px-3 py-3"><AdBadge value={a.license} map={AD_LICENSE_TONE} /></td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-700">{a.appts}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-400">{a.activity}</td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="relative inline-block">
                        <button
                          onClick={() => setOpenRow(openRow === a.id ? null : a.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        >
                          <Icon name="pi-ellipsis-h" className="text-[13px]" />
                        </button>
                        {openRow === a.id && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setOpenRow(null)} />
                            <div className="absolute right-0 z-40 mt-1 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                              {AD_ROW_ACTIONS.map((r) => (
                                <button
                                  key={r.label}
                                  onClick={() => {
                                    setOpenRow(null)
                                    if (r.act === 'view') setDetail(a)
                                  }}
                                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12px] font-medium transition-colors ${
                                    r.danger ? 'text-rose-600 hover:bg-rose-50' : 'text-slate-600 hover:bg-slate-50'
                                  }`}
                                >
                                  <Icon name={r.icon} className={`text-[12px] ${r.danger ? '' : 'text-slate-400'}`} />
                                  {r.label}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CcCard>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((a) => (
            <CcCard key={a.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-[12px] font-bold text-white">
                    {avatar(a.name)}
                  </span>
                  <div>
                    <div className="text-[14px] font-bold text-slate-900">{a.name}</div>
                    <div className="font-mono text-[11px] text-slate-400">NPN {a.npn}</div>
                  </div>
                </div>
                <AdBadge value={a.lifecycle} map={AD_LIFECYCLE_TONE} />
              </div>
              <div className="mt-3 text-[12px] text-slate-500">{a.agency}</div>
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                <div>
                  <div className="text-[10.5px] uppercase tracking-wide text-slate-400">Payment</div>
                  <div className="mt-1"><AdBadge value={a.payment} map={AD_PAYMENT_TONE} /></div>
                </div>
                <div>
                  <div className="text-[10.5px] uppercase tracking-wide text-slate-400">Licensing</div>
                  <div className="mt-1"><AdBadge value={a.license} map={AD_LICENSE_TONE} /></div>
                </div>
                <div>
                  <div className="text-[10.5px] uppercase tracking-wide text-slate-400">Compliance</div>
                  <div className="mt-1"><AdCompliance score={a.compliance} /></div>
                </div>
                <div>
                  <div className="text-[10.5px] uppercase tracking-wide text-slate-400">Appointments</div>
                  <div className="mt-1 text-[13px] font-bold text-slate-800">{a.appts}</div>
                </div>
              </div>
              <button
                onClick={() => setDetail(a)}
                className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-slate-200 py-2 text-[12.5px] font-semibold text-indigo-600 hover:bg-indigo-50/40"
              >
                View profile <Icon name="pi-arrow-right" className="text-[9px]" />
              </button>
            </CcCard>
          ))}
        </div>
      )}
    </div>
  )
}

function AgtDirectoryEmpty({ onReset }) {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white py-14 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon name="pi-users" className="text-[20px]" />
      </div>
      <div className="mt-3 text-[15px] font-bold text-slate-900">No agents found</div>
      <div className="mx-auto mt-1 max-w-sm text-[12.5px] text-slate-400">
        No agents match your search or filters. Try adjusting your criteria or onboard a new agent.
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <button onClick={onReset} className="rounded-lg border border-slate-200 px-3.5 py-2 text-[12.5px] font-semibold text-slate-600 hover:bg-slate-50">
          Clear search
        </button>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-[12.5px] font-semibold text-white hover:bg-indigo-700">
          <Icon name="pi-plus" className="text-[11px]" /> Onboard agent
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Agent profile                                                      */
/* ------------------------------------------------------------------ */

const AGT = {
  name: 'David Diaz',
  npn: '200000002',
  agency: 'Cornerstone MGA',
  type: 'Individual',
  lob: 'Health · Life',
  joined: 'Jul 2026',
  updated: 'Today',
  created: 'Jul 1, 2026',
  sync: '2 hours ago',
}

const AGT_BADGES = [
  { icon: 'pi-circle-fill', label: 'Active', tone: 'emerald' },
  { icon: 'pi-money-bill', label: 'Payment eligible', tone: 'indigo' },
  { icon: 'pi-verified', label: 'Fully compliant', tone: 'blue' },
  { icon: 'pi-id-card', label: 'Licenses current', tone: 'violet' },
]
const AGT_BADGE_TONE = {
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
  blue: 'bg-blue-50 text-blue-700 ring-blue-100',
  violet: 'bg-violet-50 text-violet-700 ring-violet-100',
}

const AGT_KPIS = [
  { icon: 'pi-dollar', tone: 'indigo', label: 'Commission earned', value: '$12,450', context: 'YTD' },
  { icon: 'pi-file', tone: 'emerald', label: 'Policies written', value: '48', context: 'active policies' },
  { icon: 'pi-briefcase', tone: 'blue', label: 'Carriers appointed', value: '8', context: 'active appointments' },
  { icon: 'pi-verified', tone: 'violet', label: 'Compliance score', value: '100%', context: 'fully compliant' },
  { icon: 'pi-id-card', tone: 'amber', label: 'License expiry', value: '45 days', context: 'next expiry' },
  { icon: 'pi-clock', tone: 'rose', label: 'Last activity', value: '2 days', context: 'ago' },
]

const AGT_LIFECYCLE = [
  { label: 'Prospect', date: 'Jul 1' },
  { label: 'Screening', date: 'Jul 3' },
  { label: 'Contracting', date: 'Jul 5' },
  { label: 'Active', date: 'Jul 7' },
]

const AGT_HEALTH = [
  { label: 'Compliance', note: '100% complete', state: 'good' },
  { label: 'Licenses', note: 'All valid', state: 'good' },
  { label: 'Appointments', note: '8 active', state: 'good' },
  { label: 'Payments', note: 'Eligible', state: 'good' },
]

const AGT_QUICKSTATS = [
  { label: 'Compliance', value: '100%' },
  { label: 'Payment eligible', value: 'Yes' },
  { label: 'Active appointments', value: '8' },
  { label: 'Active licenses', value: '12' },
  { label: 'Policies written', value: '48' },
  { label: 'Commission earned', value: '$12,450' },
]

const AGT_LICENSES = [
  { state: 'CA', lob: 'Health', number: 'CA-4412', expiry: 'Aug 23, 2026', status: 'Active' },
  { state: 'CA', lob: 'Life', number: 'CA-4413', expiry: 'Aug 23, 2026', status: 'Active' },
  { state: 'TX', lob: 'Health', number: 'TX-9920', expiry: 'Nov 2, 2026', status: 'Active' },
  { state: 'AZ', lob: 'Life', number: 'AZ-3301', expiry: 'Sep 14, 2026', status: 'Expiring' },
]
const AGT_APPOINTMENTS = [
  { carrier: 'Aetna', lob: 'Health', status: 'Active' },
  { carrier: 'Cigna', lob: 'Health', status: 'Active' },
  { carrier: 'Humana', lob: 'Life', status: 'Active' },
  { carrier: 'UnitedHealth', lob: 'Health', status: 'Pending' },
]
const AGT_COMPLIANCE = [
  { label: 'Background screening', note: 'Cleared · valid through Jun 2027', state: 'good' },
  { label: 'Attestation', note: 'Signed Jul 6, 2026', state: 'good' },
  { label: 'AML training', note: 'Completed · 2026 cycle', state: 'good' },
  { label: 'E&O insurance', note: 'On file · expires Dec 2026', state: 'good' },
]
const AGT_ORG = [
  { name: 'Cornerstone MGA', rel: 'Primary agency', tone: 'blue' },
  { name: 'Northstar Financial', rel: 'Upline FMO', tone: 'violet' },
  { name: 'Coastal Advisors', rel: 'Sub-agency', tone: 'slate' },
]
const AGT_MORE = [
  { icon: 'pi-download', label: 'Export profile' },
  { icon: 'pi-history', label: 'View audit history' },
]
const AGT_DANGER = [
  { icon: 'pi-pause', label: 'Suspend agent' },
  { icon: 'pi-power-off', label: 'Deactivate agent' },
]
const AGT_TABS = ['Overview', 'Licensing', 'Compliance', 'Production', 'Organization', 'Requests']
const AGT_ORG_TONE = {
  blue: 'bg-blue-50 text-blue-700',
  violet: 'bg-violet-50 text-violet-700',
  slate: 'bg-slate-100 text-slate-600',
}

function AgtField({ label, value }) {
  return (
    <div>
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className="mt-0.5 text-[13px] font-semibold text-slate-800">{value}</div>
    </div>
  )
}

function AgentProfile({ agent, onBack, onNavigate }) {
  const a = { ...AGT, ...(agent || {}) }
  const [tab, setTab] = useState('Overview')
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="mx-auto max-w-[1240px] px-7 py-6">
      {/* Top row: breadcrumb + action toolbar */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <nav className="flex items-center gap-2 text-[13px] text-slate-400">
          <button onClick={() => onNavigate('Command centre')} className="font-medium text-slate-500 hover:text-indigo-600">
            Command centre
          </button>
          <span className="text-slate-300">/</span>
          <button onClick={() => (onBack ? onBack() : onNavigate('Agents'))} className="font-medium text-slate-500 hover:text-indigo-600">
            Agents
          </button>
          <span className="text-slate-300">/</span>
          <span className="font-medium text-slate-700">{a.name}</span>
        </nav>
        <div className="flex flex-wrap items-center gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700">
            <Icon name="pi-send" className="text-[12px]" /> Invite to carrier
          </button>
          <span className="mx-0.5 hidden h-6 w-px bg-slate-200 sm:block" />
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[12.5px] font-semibold text-slate-600 hover:bg-slate-50">
            <Icon name="pi-id-card" className="text-[12px]" /> Manage licenses
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[12.5px] font-semibold text-slate-600 hover:bg-slate-50">
            <Icon name="pi-briefcase" className="text-[12px]" /> Manage appointments
          </button>
          <span className="mx-0.5 hidden h-6 w-px bg-slate-200 sm:block" />
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[12.5px] font-semibold text-slate-600 hover:bg-slate-50">
            <Icon name="pi-pencil" className="text-[12px]" /> Edit profile
          </button>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen((o) => !o)
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12.5px] font-semibold transition-colors ${
                menuOpen ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon name="pi-ellipsis-h" className="text-[12px]" /> More
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 z-40 mt-1.5 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                  {AGT_MORE.map((m) => (
                    <button key={m.label} onClick={() => setMenuOpen(false)} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12.5px] font-medium text-slate-600 hover:bg-slate-50">
                      <Icon name={m.icon} className="text-[13px] text-slate-400" />
                      {m.label}
                    </button>
                  ))}
                  <div className="my-1.5 border-t border-slate-100" />
                  <div className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wide text-rose-400">Danger zone</div>
                  {AGT_DANGER.map((m) => (
                    <button
                      key={m.label}
                      onClick={() => {
                        setMenuOpen(false)
                        window.confirm(`${m.label}? This action requires confirmation.`)
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12.5px] font-medium text-rose-600 hover:bg-rose-50"
                    >
                      <Icon name={m.icon} className="text-[13px]" />
                      {m.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Profile banner */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-[20px] font-bold text-white">
            {a.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h1 className="text-[21px] font-bold tracking-tight text-slate-900">{a.name}</h1>
              <span className="text-[13px] text-slate-400">Licensed Agent • Active</span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-slate-400">
              <span>National Producer Number (NPN) {a.npn}</span>
              <span className="text-slate-300">·</span>
              <span>Primary agency: <span className="font-medium text-slate-600">{a.agency}</span></span>
              <span className="text-slate-300">·</span>
              <span>Joined {a.joined}</span>
              <span className="text-slate-300">·</span>
              <span>Updated {a.updated}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {AGT_BADGES.map((b) => (
                <span key={b.label} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ring-1 ${AGT_BADGE_TONE[b.tone]}`}>
                  <Icon name={b.icon} className="text-[9px]" />
                  {b.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* KPI overview */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {AGT_KPIS.map((k) => (
          <CcCard key={k.label} className="p-4">
            <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${CC_KPI_TONES[k.tone]}`}>
              <Icon name={k.icon} className="text-[14px]" />
            </span>
            <div className="mt-3 text-[20px] font-bold leading-none tracking-tight text-slate-900">{k.value}</div>
            <div className="mt-1.5 truncate text-[11.5px] font-semibold text-slate-500">{k.label}</div>
            <div className="mt-0.5 truncate text-[11px] text-slate-400">{k.context}</div>
          </CcCard>
        ))}
      </div>

      {/* Health + Lifecycle */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CcCard className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Icon name="pi-heart" className="text-[14px]" />
              </span>
              <h2 className="text-[15px] font-semibold text-slate-900">Agent health</h2>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
              <Icon name="pi-check-circle" className="text-[12px]" /> Healthy
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {AGT_HEALTH.map((f) => (
              <div key={f.label} className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                <div className="min-w-0">
                  <div className="text-[12.5px] font-semibold text-slate-700">{f.label}</div>
                  <div className="truncate text-[11.5px] text-slate-400">{f.note}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-[12px] text-emerald-700">
            <Icon name="pi-check-circle" className="mt-0.5 text-[13px]" />
            <span><span className="font-semibold">Everything looks good.</span> No pending actions.</span>
          </div>
        </CcCard>

        <CcCard className="p-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Icon name="pi-flag" className="text-[14px]" />
            </span>
            <h2 className="text-[15px] font-semibold text-slate-900">Onboarding journey</h2>
          </div>
          <div className="mt-5 flex items-start">
            {AGT_LIFECYCLE.map((s, i) => (
              <div key={s.label} className="relative flex flex-1 flex-col items-center text-center">
                {i < AGT_LIFECYCLE.length - 1 && (
                  <span className="absolute left-1/2 top-3.5 h-0.5 w-full bg-emerald-300" />
                )}
                <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Icon name="pi-check" className="text-[11px]" />
                </span>
                <div className="mt-2 text-[12.5px] font-semibold text-slate-700">{s.label}</div>
                <div className="text-[11px] text-slate-400">{s.date}</div>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl bg-slate-50 px-3 py-2.5 text-[12px] text-slate-500">
            Fully onboarded in 6 days — activated {AGT_LIFECYCLE[3].date}.
          </div>
        </CcCard>
      </div>

      {/* Tabs */}
      <div className="mt-5 flex gap-1 overflow-x-auto border-b border-slate-200">
        {AGT_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`whitespace-nowrap border-b-2 px-3.5 py-2.5 text-[13px] font-semibold transition-colors ${
              tab === t ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === 'Overview' && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <CcCard className="p-5 lg:col-span-2">
              <h2 className="text-[15px] font-semibold text-slate-900">Agent overview</h2>
              <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-4">
                  <AgtField label="Full name" value={a.name} />
                  <AgtField label="National Producer Number (NPN)" value={a.npn} />
                  <AgtField label="Agent type" value={a.type} />
                  <AgtField label="Agency" value={a.agency} />
                  <AgtField label="Lines of business" value={a.lob} />
                </div>
                <div className="space-y-4">
                  <AgtField label="Status" value="Active" />
                  <AgtField label="Payment eligibility" value="Eligible" />
                  <AgtField label="Compliance" value="100%" />
                  <AgtField label="Created date" value={a.created} />
                  <AgtField label="Last sync" value={a.sync} />
                </div>
              </div>
            </CcCard>
            <CcCard className="p-5">
              <h2 className="text-[15px] font-semibold text-slate-900">Quick stats</h2>
              <div className="mt-3 space-y-2">
                {AGT_QUICKSTATS.map((s) => (
                  <div key={s.label} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
                    <span className="text-[12px] text-slate-500">{s.label}</span>
                    <span className="text-[13px] font-bold text-slate-900">{s.value}</span>
                  </div>
                ))}
              </div>
            </CcCard>
          </div>
        )}

        {tab === 'Licensing' && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <CcCard className="overflow-hidden">
              <div className="px-5 py-3.5 text-[14px] font-semibold text-slate-900">Licenses</div>
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="border-y border-slate-100 bg-slate-50/60 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-5 py-2.5">State</th>
                    <th className="px-3 py-2.5">LOB</th>
                    <th className="px-3 py-2.5">Expiry</th>
                    <th className="px-5 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {AGT_LICENSES.map((l, i) => (
                    <tr key={i} className="border-b border-slate-50 last:border-0">
                      <td className="px-5 py-2.5 font-semibold text-slate-800">{l.state}</td>
                      <td className="px-3 py-2.5 text-slate-600">{l.lob}</td>
                      <td className="px-3 py-2.5 text-slate-500">{l.expiry}</td>
                      <td className="px-5 py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${l.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CcCard>
            <CcCard className="overflow-hidden">
              <div className="px-5 py-3.5 text-[14px] font-semibold text-slate-900">Appointments &amp; authorities</div>
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="border-y border-slate-100 bg-slate-50/60 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-5 py-2.5">Carrier</th>
                    <th className="px-3 py-2.5">LOB</th>
                    <th className="px-5 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {AGT_APPOINTMENTS.map((a, i) => (
                    <tr key={i} className="border-b border-slate-50 last:border-0">
                      <td className="px-5 py-2.5 font-semibold text-slate-800">{a.carrier}</td>
                      <td className="px-3 py-2.5 text-slate-600">{a.lob}</td>
                      <td className="px-5 py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${a.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CcCard>
          </div>
        )}

        {tab === 'Compliance' && (
          <CcCard className="p-5">
            <h2 className="text-[15px] font-semibold text-slate-900">Compliance &amp; screening</h2>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {AGT_COMPLIANCE.map((c) => (
                <div key={c.label} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Icon name="pi-check-circle" className="text-[13px]" />
                  </span>
                  <div>
                    <div className="text-[12.5px] font-semibold text-slate-700">{c.label}</div>
                    <div className="text-[11.5px] text-slate-400">{c.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </CcCard>
        )}

        {tab === 'Production' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { label: 'Monthly production', value: '48 policies', delta: '+8', stroke: '#6366f1', values: [4, 6, 5, 7, 9, 8] },
              { label: 'Commission trend', value: '$12,450', delta: '+14%', stroke: '#10b981', values: [1.4, 1.8, 2.1, 1.9, 2.4, 2.8] },
              { label: 'Revenue', value: '$61K', delta: '+9%', stroke: '#3b82f6', values: [32, 36, 41, 38, 44, 48] },
              { label: 'Growth', value: '14%', delta: '+3pt', stroke: '#8b5cf6', values: [8, 9, 11, 10, 12, 14] },
            ].map((p) => (
              <CcCard key={p.label} className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[12.5px] font-semibold text-slate-500">{p.label}</div>
                    <div className="mt-1 text-[22px] font-bold leading-none tracking-tight text-slate-900">{p.value}</div>
                  </div>
                  <CcDelta delta={p.delta} up={true} />
                </div>
                <div className="mt-3">
                  <AgdSpark values={p.values} stroke={p.stroke} />
                </div>
              </CcCard>
            ))}
            <CcCard className="p-5 sm:col-span-2">
              <h2 className="text-[15px] font-semibold text-slate-900">Carrier breakdown</h2>
              <div className="mt-4 space-y-3.5">
                {AGD_CARRIERS.map((c) => (
                  <div key={c.name}>
                    <div className="flex items-center justify-between text-[12.5px]">
                      <span className="font-semibold text-slate-800">{c.name}</span>
                      <span className="text-slate-500">{c.policies} policies · <span className="font-semibold text-indigo-600">{c.share}%</span></span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${c.share}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CcCard>
          </div>
        )}

        {tab === 'Organization' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {AGT_ORG.map((o) => (
              <CcCard key={o.name} className="p-5">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${AGT_ORG_TONE[o.tone]}`}>
                  {o.rel}
                </span>
                <div className="mt-3 flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                    <Icon name="pi-building" className="text-[14px]" />
                  </span>
                  <div className="text-[14px] font-bold text-slate-900">{o.name}</div>
                </div>
              </CcCard>
            ))}
          </div>
        )}

        {tab === 'Requests' && (
          <AgdEmpty
            icon="pi-inbox"
            title="No open requests"
            desc="There are no pending licensing, appointment, or transfer requests for this agent."
          />
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* NACHA operations                                                   */
/* ------------------------------------------------------------------ */

const NO_KPIS = [
  { icon: 'pi-server', tone: 'indigo', label: 'Batches this month', value: '128', delta: '+12%', up: true, context: 'vs. last month' },
  { icon: 'pi-dollar', tone: 'emerald', label: 'Volume transmitted', value: '$18.4M', delta: '+9%', up: true, context: 'credits + debits' },
  { icon: 'pi-chart-line', tone: 'blue', label: 'Return rate', value: '0.42%', delta: 'On target', up: null, context: 'below 1% threshold' },
  { icon: 'pi-verified', tone: 'violet', label: 'Settlement success', value: '99.2%', delta: '+0.3pt', up: true, context: 'last 30 days' },
]

const NO_HEALTH_SEV = {
  critical: { label: 'Critical', icon: 'pi-times-circle', iconText: 'text-rose-500', chip: 'bg-rose-50 text-rose-700' },
  warning: { label: 'Needs review', icon: 'pi-exclamation-triangle', iconText: 'text-amber-500', chip: 'bg-amber-50 text-amber-700' },
  info: { label: 'Waiting', icon: 'pi-info-circle', iconText: 'text-blue-500', chip: 'bg-blue-50 text-blue-700' },
  good: { label: 'Healthy', icon: 'pi-check-circle', iconText: 'text-emerald-500', chip: 'bg-emerald-50 text-emerald-700' },
}
const NO_ALERTS_OLD = [
  { label: 'Pending returns', value: 6, sev: 'amber' },
  { label: 'Failed batches', value: 1, sev: 'red' },
  { label: 'Review required', value: 3, sev: 'amber' },
  { label: 'Validation issues', value: 2, sev: 'red' },
]
const NO_ALERT_DOT = { red: 'bg-rose-500', amber: 'bg-amber-500', green: 'bg-emerald-500' }

const NO_HEALTH = [
  { sev: 'critical', count: 1, title: 'Failed batch', desc: 'Refund Batch failed validation due to routing mismatch on 3 entries.', batch: 'Refund Batch' },
  { sev: 'warning', count: 2, title: 'Validation issues', desc: 'Premium Collections batch contains a hash total warning.', batch: 'Premium Collections' },
  { sev: 'warning', count: 6, title: 'Pending returns', desc: 'Returns received and awaiting investigation.' },
  { sev: 'warning', count: 3, title: 'Review required', desc: 'Batches transmitted and pending operational review.' },
  { sev: 'info', count: 2, title: 'Awaiting confirmation', desc: 'Successfully transmitted and waiting for bank acknowledgment.', batch: 'Payroll Deposit Batch' },
  { sev: 'good', title: 'Return rate healthy (0.42%)', desc: 'Below the NACHA threshold of 1%.' },
  { sev: 'good', title: 'Settlement health', desc: 'No settlement anomalies detected in the last 30 days.' },
]

const NO_STATUS_TONES = {
  Draft: 'bg-slate-100 text-slate-600',
  Validated: 'bg-blue-50 text-blue-700',
  Submitted: 'bg-indigo-50 text-indigo-700',
  Transmitted: 'bg-violet-50 text-violet-700',
  Confirmed: 'bg-emerald-50 text-emerald-700',
  Failed: 'bg-rose-50 text-rose-700',
  Reversed: 'bg-amber-50 text-amber-700',
}
const NO_SETTLE_TONES = {
  Settled: 'bg-emerald-50 text-emerald-700',
  Pending: 'bg-amber-50 text-amber-700',
  Failed: 'bg-rose-50 text-rose-700',
  '—': 'bg-slate-100 text-slate-500',
}
const NO_VALID_TONES = {
  Passed: 'text-emerald-600',
  Warning: 'text-amber-600',
  Failed: 'text-rose-600',
  '—': 'text-slate-400',
}
const NO_VALID_ICON = {
  Passed: 'pi-check-circle',
  Warning: 'pi-exclamation-triangle',
  Failed: 'pi-times-circle',
  '—': 'pi-minus-circle',
}

const NO_BATCHES = [
  { name: 'Payroll Deposit Batch', id: 'BAT-20260708-001', date: 'Jul 08, 2026', sec: 'PPD', entries: 1240, credit: '$2,480,000', debit: '$0', status: 'Transmitted', settle: 'Pending', valid: 'Passed', updated: '2h ago' },
  { name: 'Vendor Payments', id: 'BAT-20260708-002', date: 'Jul 08, 2026', sec: 'CCD', entries: 320, credit: '$840,000', debit: '$0', status: 'Confirmed', settle: 'Settled', valid: 'Passed', updated: '5h ago' },
  { name: 'Premium Collections', id: 'BAT-20260709-003', date: 'Jul 09, 2026', sec: 'PPD', entries: 2100, credit: '$0', debit: '$1,260,000', status: 'Submitted', settle: 'Pending', valid: 'Warning', updated: '1h ago' },
  { name: 'Commission Payouts', id: 'BAT-20260707-004', date: 'Jul 07, 2026', sec: 'PPD', entries: 480, credit: '$312,000', debit: '$0', status: 'Confirmed', settle: 'Settled', valid: 'Passed', updated: '1d ago' },
  { name: 'Refund Batch', id: 'BAT-20260709-005', date: 'Jul 09, 2026', sec: 'CCD', entries: 60, credit: '$18,400', debit: '$0', status: 'Failed', settle: 'Failed', valid: 'Failed', updated: '30m ago' },
  { name: 'Draft Payroll — Jul 10', id: 'BAT-20260710-006', date: 'Jul 10, 2026', sec: 'PPD', entries: 0, credit: '$0', debit: '$0', status: 'Draft', settle: '—', valid: '—', updated: 'just now' },
]

const NO_INSIGHTS = [
  { severity: 'critical', text: 'Refund Batch failed validation — routing mismatch on 3 entries.', batch: 'Refund Batch' },
  { severity: 'warning', text: 'Premium Collections has a validation warning (hash total).', batch: 'Premium Collections' },
  { severity: 'info', text: '2 batches are transmitted and awaiting confirmation.', batch: 'Payroll Deposit Batch' },
  { severity: 'info', text: 'Return rate 0.42% — comfortably below the 1% threshold.', batch: null },
  { severity: 'good', text: 'No settlement anomalies detected in the last 30 days.', batch: null },
]
const NO_SEV = {
  critical: { dot: 'bg-rose-500', icon: 'pi-times-circle', text: 'text-rose-500' },
  warning: { dot: 'bg-amber-500', icon: 'pi-exclamation-triangle', text: 'text-amber-500' },
  info: { dot: 'bg-blue-500', icon: 'pi-info-circle', text: 'text-blue-500' },
  good: { dot: 'bg-emerald-500', icon: 'pi-check-circle', text: 'text-emerald-500' },
}

const NO_VALIDATION = [
  'Routing numbers verified',
  'Hash total validated',
  'Account validation completed',
  'File format validated',
  'Transmission successful',
]
const NO_TIMELINE = [
  { label: 'Batch created', time: 'Jul 08, 08:12', done: true },
  { label: 'Validation completed', time: 'Jul 08, 08:14', done: true },
  { label: 'ACH file generated', time: 'Jul 08, 08:15', done: true },
  { label: 'Submitted to ODFI', time: 'Jul 08, 08:20', done: true },
  { label: 'Transmitted', time: 'Jul 08, 08:22', done: true },
  { label: 'Confirmed', time: 'Awaiting confirmation', done: false },
]
const NO_ENTRIES = [
  { customer: 'A. Morgan', trace: '091000019283746', amount: '$2,000', account: '••4821', type: 'Credit', status: 'Processed' },
  { customer: 'B. Chen', trace: '091000019283747', amount: '$2,000', account: '••9930', type: 'Credit', status: 'Processed' },
  { customer: 'C. Ramirez', trace: '091000019283748', amount: '$1,850', account: '••1174', type: 'Credit', status: 'Processed' },
  { customer: 'D. Okafor', trace: '091000019283749', amount: '$2,200', account: '••6650', type: 'Credit', status: 'Pending' },
  { customer: 'E. Wallace', trace: '091000019283750', amount: '$2,000', account: '••3092', type: 'Credit', status: 'Processed' },
]
const NO_BATCH_INSIGHTS = [
  'No validation issues detected',
  'Credit amount within expected range',
  'Return risk below threshold',
  'Ready for settlement',
]

function NoStat({ label, value, tone }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className={`mt-0.5 text-[15px] font-bold ${tone || 'text-slate-900'}`}>{value}</div>
    </div>
  )
}

function NachaBatchDrawer({ batch, onClose }) {
  if (!batch) return null
  const failed = batch.valid === 'Failed'
  const health = failed ? 38 : batch.valid === 'Warning' ? 74 : 92
  const risk = failed ? { label: 'High risk', tone: 'text-rose-600' } : batch.valid === 'Warning' ? { label: 'Medium risk', tone: 'text-amber-600' } : { label: 'Low risk', tone: 'text-emerald-600' }
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-slate-900/20" onClick={onClose} />
      <div className="absolute right-0 top-0 flex h-full w-[540px] max-w-[95vw] flex-col border-l border-slate-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 p-5">
          <div>
            <div className="text-[16px] font-bold text-slate-900">{batch.name}</div>
            <div className="mt-1 text-[12.5px] text-slate-500">
              {batch.sec} • {batch.date}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${NO_STATUS_TONES[batch.status]}`}>
                {batch.status}
              </span>
              <span className="text-[11.5px] text-slate-400">ODFI: Nexus Bank • 091000019</span>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
            <Icon name="pi-times" className="text-[14px]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <NoStat label="Entries" value={batch.entries.toLocaleString()} />
            <NoStat label="Credit total" value={batch.credit} tone="text-emerald-600" />
            <NoStat label="Debit total" value={batch.debit} tone="text-slate-900" />
            <NoStat label="Status" value={batch.status} />
          </div>

          {/* Health & compliance */}
          <div className="mt-5 rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[13.5px] font-semibold text-slate-900">Batch health &amp; compliance</h3>
              <span className="text-[13px] font-bold text-slate-900">{health}/100</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full ${health >= 85 ? 'bg-emerald-500' : health >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${health}%` }} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[11.5px] font-semibold">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${failed ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                <Icon name={failed ? 'pi-times' : 'pi-check'} className="text-[10px]" /> {failed ? 'Validation failed' : 'Validation passed'}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                <Icon name="pi-verified" className="text-[10px]" /> NACHA compliant
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 ${risk.tone}`}>
                <Icon name="pi-shield" className="text-[10px]" /> {risk.label}
              </span>
            </div>
          </div>

          {/* Validation checklist */}
          <div className="mt-5">
            <h3 className="text-[13.5px] font-semibold text-slate-900">Validation results</h3>
            <div className="mt-2 space-y-1.5">
              {NO_VALIDATION.map((v, i) => {
                const bad = failed && i === 0
                return (
                  <div key={v} className="flex items-center gap-2.5 text-[12.5px] text-slate-600">
                    <Icon name={bad ? 'pi-times-circle' : 'pi-check-circle'} className={`text-[13px] ${bad ? 'text-rose-500' : 'text-emerald-500'}`} />
                    {bad ? 'Routing numbers — 3 mismatches found' : v}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Processing timeline */}
          <div className="mt-5">
            <h3 className="text-[13.5px] font-semibold text-slate-900">Processing timeline</h3>
            <div className="relative mt-3 ml-2 border-l border-slate-200 pl-6">
              {NO_TIMELINE.map((t) => (
                <div key={t.label} className="relative pb-4 last:pb-0">
                  <span className={`absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full ring-1 ${t.done ? 'bg-emerald-500 ring-emerald-500 text-white' : 'bg-white ring-slate-200 text-slate-300'}`}>
                    <Icon name={t.done ? 'pi-check' : 'pi-clock'} className="text-[10px]" />
                  </span>
                  <div className="text-[12.5px] font-semibold text-slate-800">{t.label}</div>
                  <div className="text-[11px] text-slate-400">{t.time}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Entry preview */}
          <div className="mt-5">
            <h3 className="text-[13.5px] font-semibold text-slate-900">Entry preview</h3>
            <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-slate-100">
              <table className="w-full text-[12px]">
                <thead className="sticky top-0 bg-slate-50/90">
                  <tr className="text-left text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-3 py-2">Customer</th>
                    <th className="px-3 py-2">Trace</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {NO_ENTRIES.map((e) => (
                    <tr key={e.trace} className="border-t border-slate-50">
                      <td className="px-3 py-2 font-medium text-slate-700">{e.customer}</td>
                      <td className="px-3 py-2 font-mono text-[11px] text-slate-400">{e.trace}</td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-700">{e.amount}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${e.status === 'Processed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {e.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Insights */}
          <div className="mt-5 rounded-2xl bg-indigo-50/50 p-4">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-900">
              <Icon name="pi-sparkles" className="text-[13px] text-indigo-600" /> Operational insights
            </div>
            <div className="mt-2 space-y-1.5">
              {NO_BATCH_INSIGHTS.map((t) => (
                <div key={t} className="flex items-center gap-2 text-[12px] text-slate-600">
                  <Icon name="pi-check-circle" className="text-[12px] text-emerald-500" /> {t}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action area */}
        <div className="space-y-2 border-t border-slate-100 p-4">
          <button className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-2.5 text-[13px] font-semibold text-white hover:bg-indigo-700">
            <Icon name="pi-check" className="text-[12px]" /> Confirm batch
          </button>
          <div className="grid grid-cols-3 gap-2">
            <button className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-[11.5px] font-semibold text-slate-600 hover:bg-slate-50">
              <Icon name="pi-download" className="text-[11px]" /> ACH file
            </button>
            <button className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-[11.5px] font-semibold text-slate-600 hover:bg-slate-50">
              <Icon name="pi-history" className="text-[11px]" /> Log
            </button>
            <button className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-[11.5px] font-semibold text-slate-600 hover:bg-slate-50">
              <Icon name="pi-file-export" className="text-[11px]" /> Export
            </button>
          </div>
          <button className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-rose-200 py-2 text-[12px] font-semibold text-rose-600 hover:bg-rose-50">
            <Icon name="pi-arrow-right-arrow-left" className="text-[11px]" /> Reverse batch
          </button>
        </div>
      </div>
    </div>
  )
}

function NachaOperations({ onNavigate }) {
  const [selected, setSelected] = useState(null)
  const [query, setQuery] = useState('')
  const [healthOpen, setHealthOpen] = useState(false)
  const openBatch = (name) => setSelected(NO_BATCHES.find((b) => b.name === name))
  const batches = NO_BATCHES.filter(
    (b) => b.name.toLowerCase().includes(query.toLowerCase()) || b.id.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="mx-auto max-w-[1240px] px-7 py-6">
      <FmoCrumb title="NACHA Operations" onNavigate={onNavigate} />

      {/* Header */}
      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Icon name="pi-server" className="text-[18px]" />
          </span>
          <div className="min-w-0">
            <h1 className="text-[22px] font-bold tracking-tight text-slate-900">NACHA Operations</h1>
            <p className="mt-0.5 max-w-xl text-[13px] text-slate-500">
              Process, monitor, and reconcile ACH batches — validation, transmission, settlement, and
              return management.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[12.5px] font-semibold text-slate-600 hover:bg-slate-50">
            <Icon name="pi-file-export" className="text-[12px]" /> Export report
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[12.5px] font-semibold text-slate-600 hover:bg-slate-50">
            <Icon name="pi-upload" className="text-[12px]" /> Upload ACH file
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-[12.5px] font-semibold text-white hover:bg-indigo-700">
            <Icon name="pi-plus" className="text-[12px]" /> New batch
          </button>
        </div>
      </div>

      {/* KPI overview */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {NO_KPIS.map((k) => (
          <CcCard key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${CC_KPI_TONES[k.tone]}`}>
                <Icon name={k.icon} className="text-[14px]" />
              </span>
              <CcDelta delta={k.delta} up={k.up} />
            </div>
            <div className="mt-3 text-[24px] font-bold leading-none tracking-tight text-slate-900">{k.value}</div>
            <div className="mt-2 truncate text-[12px] font-semibold text-slate-600">{k.label}</div>
            <div className="mt-0.5 truncate text-[11px] text-slate-400">{k.context}</div>
          </CcCard>
        ))}
      </div>

      {/* Operational health */}
      <CcCard className="mt-4 overflow-hidden">
        <button
          onClick={() => setHealthOpen((o) => !o)}
          className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-50"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Icon name="pi-heart" className="text-[14px]" />
            </span>
            <h2 className="text-[14px] font-semibold text-slate-900">Operational health</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-600">
              1 critical
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
              3 warnings
            </span>
          </div>
          <Icon name={healthOpen ? 'pi-chevron-up' : 'pi-chevron-down'} className="text-[12px] text-slate-400" />
        </button>
        {healthOpen && (
        <div className="divide-y divide-slate-50 border-t border-slate-100">
          {NO_HEALTH.map((h, i) => {
            const s = NO_HEALTH_SEV[h.sev]
            const clickable = !!h.batch
            const Row = clickable ? 'button' : 'div'
            return (
              <Row
                key={i}
                {...(clickable ? { onClick: () => openBatch(h.batch) } : {})}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left ${clickable ? 'transition-colors hover:bg-slate-50' : ''}`}
              >
                <Icon name={s.icon} className={`shrink-0 text-[15px] ${s.iconText}`} />
                {h.count != null && (
                  <span className="w-6 shrink-0 text-center text-[15px] font-bold text-slate-900">{h.count}</span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-slate-800">{h.title}</div>
                  <div className="truncate text-[12px] text-slate-400">{h.desc}</div>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.chip}`}>
                  {s.label}
                </span>
                {clickable && <Icon name="pi-chevron-right" className="shrink-0 text-[11px] text-slate-300" />}
              </Row>
            )
          })}
        </div>
        )}
      </CcCard>

      {/* Older version (for comparison) */}
      <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 p-4">
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Older version (for comparison)
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-500">
            <Icon name="pi-bolt" className="text-[12px] text-indigo-500" /> Operational alerts
          </span>
          {NO_ALERTS_OLD.map((al) => (
            <span
              key={al.label}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600"
            >
              <span className={`h-2 w-2 rounded-full ${NO_ALERT_DOT[al.sev]}`} />
              <span className="font-bold text-slate-900">{al.value}</span>
              {al.label}
            </span>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-xl border border-indigo-100 bg-indigo-50/40 px-4 py-2.5">
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-indigo-700">
            <Icon name="pi-sparkles" className="text-[12px]" /> Insights
          </span>
          {NO_INSIGHTS.map((ins, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 text-[12px] text-slate-600">
              <Icon name={NO_SEV[ins.severity].icon} className={`text-[11px] ${NO_SEV[ins.severity].text}`} />
              {ins.text}
            </span>
          ))}
        </div>
      </div>

      {/* Batch monitoring */}
      <CcCard className="mt-4 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search batches…"
                className="h-9 w-56 rounded-lg border border-slate-200 pl-8 pr-3 text-[12.5px] text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              <Icon name="pi-search" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-slate-400" />
            </div>
            <div className="flex items-center gap-1.5">
              <select className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[12px] font-medium text-slate-600 focus:border-indigo-400 focus:outline-none">
                <option>All statuses</option>
                <option>Transmitted</option>
                <option>Confirmed</option>
                <option>Failed</option>
                <option>Draft</option>
              </select>
              <select className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[12px] font-medium text-slate-600 focus:border-indigo-400 focus:outline-none">
                <option>Last 30 days</option>
                <option>This week</option>
                <option>Today</option>
              </select>
              <button className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-[12px] font-semibold text-slate-600 hover:bg-slate-50">
                <Icon name="pi-bookmark" className="text-[11px]" /> Views
              </button>
              <button className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-[12px] font-semibold text-slate-600 hover:bg-slate-50">
                <Icon name="pi-file-export" className="text-[11px]" /> Export
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-[12.5px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-2.5">Batch</th>
                  <th className="px-3 py-2.5">Effective</th>
                  <th className="px-3 py-2.5">SEC</th>
                  <th className="px-3 py-2.5 text-right">Entries</th>
                  <th className="px-3 py-2.5 text-right">Credit</th>
                  <th className="px-3 py-2.5 text-right">Debit</th>
                  <th className="px-3 py-2.5">Processing</th>
                  <th className="px-3 py-2.5">Settlement</th>
                  <th className="px-3 py-2.5">Validation</th>
                  <th className="px-4 py-2.5">Updated</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b.id} onClick={() => setSelected(b)} className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{b.name}</div>
                      <div className="font-mono text-[10.5px] text-slate-400">{b.id}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-500">{b.date}</td>
                    <td className="px-3 py-3"><span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">{b.sec}</span></td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-700">{b.entries.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right text-emerald-600">{b.credit}</td>
                    <td className="px-3 py-3 text-right text-slate-600">{b.debit}</td>
                    <td className="px-3 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${NO_STATUS_TONES[b.status]}`}>{b.status}</span></td>
                    <td className="px-3 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${NO_SETTLE_TONES[b.settle]}`}>{b.settle}</span></td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center gap-1 text-[12px] font-medium ${NO_VALID_TONES[b.valid]}`}>
                        <Icon name={NO_VALID_ICON[b.valid]} className="text-[11px]" /> {b.valid}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-400">{b.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CcCard>

      <NachaBatchDrawer batch={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

function MemberRoster({ onNavigate }) {
  const cols = [
    'Enrollment ID', 'Member', 'Carrier', 'Coverage type', 'Status', 'Coverage start', 'Coverage end',
  ]
  return (
    <div className="mx-auto max-w-[1240px] px-7 py-6">
      <FmoCrumb title="Member Roster" onNavigate={onNavigate} />
      <FmoPageHead
        title="Enrollments"
        subtitle="Member enrollments across every lifecycle stage."
        action={
          <button
            onClick={() => onNavigate('New enrollment')}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-indigo-700"
          >
            <Icon name="pi-plus" className="text-[12px]" />
            New enrollment
          </button>
        }
      />
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="relative w-64 max-w-full">
            <Icon name="pi-search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-slate-400" />
            <input
              placeholder="Search..."
              className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-[13px] text-slate-600 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">
            <Icon name="pi-refresh" className="text-[14px]" />
          </button>
          <span className="ml-auto text-[12px] text-slate-400">0 enrollments</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/60">
                {cols.map((c) => (
                  <Th key={c} filter sort>
                    {c}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={cols.length} className="py-12 text-center text-[13px] text-slate-500">
                  No data available
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100">
          <TableFooter showing="Showing 0–0 of 0" />
        </div>
      </div>
    </div>
  )
}

const ENROLL_STEPS = [
  { n: 1, title: 'Member identity', sub: 'Member, plan & coverage type' },
  { n: 2, title: 'Coverage', sub: 'Coverage window & enrollment period' },
  { n: 3, title: 'Agent attribution', sub: 'Agents & service area' },
]

function SearchField({ label, required, placeholder, help }) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div className="relative mt-2">
        <input
          placeholder={placeholder}
          className="h-10 w-full rounded-lg border border-slate-200 px-3 pr-9 text-[13px] text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        <Icon name="pi-chevron-down" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400" />
      </div>
      {help && <p className="mt-1.5 text-[11px] text-slate-400">{help}</p>}
    </div>
  )
}

function NewEnrollment({ onNavigate }) {
  return (
    <div className="mx-auto max-w-[1240px] px-7 py-6">
      <div className="mt-1">
        <h1 className="text-[22px] font-bold tracking-tight text-slate-900">New enrollment</h1>
        <p className="mt-1 text-[13px] text-slate-500">
          Capture identity, coverage, agent attribution, and (optionally) retroactive justification.
        </p>
      </div>

      {/* Stepper */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-8 py-7">
        <div className="flex items-start">
          {ENROLL_STEPS.map((s, i) => (
            <Fragment key={s.n}>
              <div className="flex w-48 flex-col items-center text-center">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold ${
                    s.n === 1 ? 'bg-indigo-600 text-white' : 'border border-slate-300 bg-white text-slate-400'
                  }`}
                >
                  {s.n}
                </div>
                <div
                  className={`mt-2 text-[13px] font-semibold ${s.n === 1 ? 'text-indigo-600' : 'text-slate-500'}`}
                >
                  {s.title}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-400">{s.sub}</div>
              </div>
              {i < ENROLL_STEPS.length - 1 && <div className="mt-[18px] h-0.5 flex-1 bg-slate-200" />}
            </Fragment>
          ))}
        </div>
      </div>

      {/* Member identity */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
          <Icon name="pi-id-card" className="text-[15px] text-slate-500" />
          <h2 className="text-[15px] font-semibold text-slate-900">Member identity</h2>
        </div>
        <div className="px-6 py-6">
          <p className="text-[13px] text-slate-500">
            Member demographics are sourced from the master member record; this form only captures
            coverage-side identifiers. MBI, Medicaid, and Carrier-member IDs are encrypted at rest.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
            <SearchField label="Member" required placeholder="Search members…" help="Search members by name and pick the matching record." />
            <SelectField label="Coverage type" required placeholder="MAPD" options={['MAPD', 'MA', 'PDP', 'Medigap']} />
            <SearchField label="Plan" required placeholder="Search plans by id or name…" help="No cached plans — refresh one via the Plans surface." />
            <div>
              <FieldLabel required>Carrier</FieldLabel>
              <input
                disabled
                placeholder="Auto-filled from the selected plan"
                className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-400 placeholder:text-slate-400"
              />
              <p className="mt-1.5 text-[11px] text-slate-400">Set automatically from the selected plan.</p>
            </div>
            <div className="md:col-span-2">
              <TextField
                label="MBI"
                placeholder="1AB2C34D5E6"
                help="Medicare Beneficiary Identifier — 11 characters, format 1EG4-TE5-MK73 (e.g. 1EG4TE5MK73). Stored encrypted; only the last 4 digits are searchable."
              />
            </div>
            <div className="md:col-span-2">
              <TextField label="Carrier member ID" placeholder="" />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
            <button
              onClick={() => onNavigate('Member Roster')}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button className="rounded-lg bg-indigo-600 px-5 py-2 text-[13px] font-semibold text-white hover:bg-indigo-700">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Nexus Copilot                                                      */
/* ------------------------------------------------------------------ */

const COPILOT_SUGGESTIONS = [
  'Show active agents',
  'Open NACHA Operations',
  'Find payment blocks',
  'Show expiring licenses',
  'Open Northstar agency',
  'Summarize operational health',
]

function copilotRespond(q) {
  const s = q.toLowerCase()
  const has = (...w) => w.every((x) => s.includes(x))
  if (s.includes('david')) return { type: 'entity', kind: 'Agent', title: 'David Diaz', subtitle: 'Active agent · Cornerstone MGA', meta: [['NPN', '200000002'], ['Compliance', '100%'], ['Appointments', '8']], action: { label: 'Open agent', to: 'Agents' } }
  if (s.includes('northstar')) return { type: 'entity', kind: 'Agency', title: 'Northstar Financial', subtitle: 'FMO · Healthy', meta: [['Agents', '127'], ['Revenue', '$245K'], ['Sub-agencies', '6']], action: { label: 'Open agency', to: 'Agencies' } }
  if (s.includes('nacha') || has('ach', 'batch') || (s.includes('batch') && (s.includes('confirm') || s.includes('awaiting')))) {
    if (s.includes('confirm') || s.includes('awaiting'))
      return { type: 'list', title: 'Batches awaiting confirmation (2)', items: [{ name: 'Payroll Deposit Batch', sub: 'PPD · $2.48M', badge: 'Transmitted' }, { name: 'Premium Collections', sub: 'PPD · $1.26M', badge: 'Submitted' }], action: { label: 'Open NACHA Operations', to: 'NACHA Operations' } }
    return { type: 'nav', title: 'NACHA Operations', desc: 'ACH batch processing, settlement, validation & returns.', action: { label: 'Open NACHA Operations', to: 'NACHA Operations' } }
  }
  if ((s.includes('commission') && s.includes('ledger')) || s.includes('bob baker')) return { type: 'nav', title: 'Commission Ledger', desc: 'Producer commission earnings, payouts & running balances.', action: { label: 'Open Commission Ledger', to: 'Commission Ledger' } }
  if (s.includes('dispute')) return { type: 'nav', title: 'Pending disputes', desc: '4 open disputes awaiting response · $18.4K in dispute.', action: { label: 'Open Disputes', to: 'Disputes' } }
  if (s.includes('inactive') && s.includes('agent')) return { type: 'list', title: 'Inactive agents (1)', items: [{ name: 'Nina Owens', sub: 'No activity · 21 days', badge: 'Inactive' }], action: { label: 'Open Agents', to: 'Agents' } }
  if (s.includes('payment block') || s.includes('blocked') || s.includes('payment blocks')) return { type: 'list', title: 'Payment-blocked agents (2)', items: [{ name: 'Nina Owens', sub: 'Compliance 72% · license expired', badge: 'Blocked' }, { name: 'Owen Frost', sub: 'Onboarding incomplete', badge: 'Blocked' }], action: { label: 'Open Agents', to: 'Agents' } }
  if (s.includes('licens') && s.includes('expir')) return { type: 'list', title: 'Licenses expiring soon (4)', items: [{ name: 'Marcus Bell', sub: 'AZ license · 12 days', badge: 'Expiring' }, { name: 'Bright Insurance', sub: 'Agency · multiple', badge: 'Expiring' }], action: { label: 'Open Agents', to: 'Agents' } }
  if (s.includes('compliance') && !s.includes('score')) return { type: 'list', title: 'Agencies with compliance issues (2)', items: [{ name: 'Summit Partners', sub: 'Missing documents', badge: 'Attention' }, { name: 'Bright Insurance', sub: 'Expiring licenses', badge: 'Attention' }], action: { label: 'Open Agencies', to: 'Agencies' } }
  if (s.includes('added this month') || s.includes('new agenc')) return { type: 'list', title: 'New agencies this month (3)', items: [{ name: 'Coastal Advisors', sub: 'Agency · Compatible MGA' }, { name: 'Peak Agency', sub: 'Agency · Summit Partners' }], action: { label: 'Open Agencies', to: 'Agencies' } }
  if (s.includes('active agent')) return { type: 'insight', title: 'Active agents', value: '41', note: 'of 48 total · +3 this month', bullets: ['4 prospects in onboarding', '3 inactive agents'], action: { label: 'Open Agents', to: 'Agents' } }
  if (s.includes('highest commission') || s.includes('highest revenue') || s.includes('top agenc')) return { type: 'insight', title: 'Top agency this month', value: 'Northstar Financial', note: '$245K generated · 42% from Aetna', bullets: ['Up 14% vs last month'], action: { label: 'Open agency', to: 'Agencies' } }
  if (s.includes('operational health') || s.includes('summarize') || s.includes('summary')) return { type: 'insight', title: 'Operational health', value: 'Healthy', note: 'Return rate 0.42% · settlement 99.2%', bullets: ['1 failed batch needs attention', '6 returns awaiting resolution'], action: { label: 'Open NACHA Operations', to: 'NACHA Operations' } }
  if (s.includes('attention') || s.includes('require')) return { type: 'list', title: 'Requiring attention (2)', items: [{ name: 'Summit Partners', sub: 'Missing documents', badge: 'Attention' }, { name: 'Vertex Direct', sub: 'Inactive 34 days', badge: 'Inactive' }], action: { label: 'Open Agencies', to: 'Agencies' } }
  return { type: 'text', text: 'I can navigate the platform, search records, explain data, and surface insights. Try “Show David Diaz”, “Which agents are payment blocked?”, or “Open NACHA Operations”.' }
}

const COPILOT_BADGE_TONE = {
  Inactive: 'bg-slate-100 text-slate-500',
  Blocked: 'bg-rose-50 text-rose-700',
  Expiring: 'bg-amber-50 text-amber-700',
  Attention: 'bg-amber-50 text-amber-700',
  Transmitted: 'bg-violet-50 text-violet-700',
  Submitted: 'bg-indigo-50 text-indigo-700',
}

function CopilotResponse({ resp, onGo }) {
  const Action = resp.action ? (
    <button
      onClick={() => onGo(resp.action.to)}
      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-indigo-700"
    >
      {resp.action.label}
      <Icon name="pi-arrow-right" className="text-[9px]" />
    </button>
  ) : null

  if (resp.type === 'text') return <p className="text-[12.5px] leading-relaxed text-slate-600">{resp.text}</p>

  if (resp.type === 'entity')
    return (
      <div>
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-700">
          <Icon name="pi-check-circle" className="text-[10px]" /> {resp.kind} found
        </div>
        <div className="rounded-xl border border-slate-200 p-3">
          <div className="text-[14px] font-bold text-slate-900">{resp.title}</div>
          <div className="text-[11.5px] text-slate-400">{resp.subtitle}</div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {resp.meta.map(([k, v]) => (
              <span key={k} className="text-[11.5px] text-slate-500">
                {k}: <span className="font-semibold text-slate-700">{v}</span>
              </span>
            ))}
          </div>
        </div>
        {Action}
      </div>
    )

  if (resp.type === 'nav')
    return (
      <div>
        <div className="rounded-xl border border-slate-200 p-3">
          <div className="text-[13.5px] font-bold text-slate-900">{resp.title}</div>
          <div className="mt-0.5 text-[11.5px] text-slate-500">{resp.desc}</div>
        </div>
        {Action}
      </div>
    )

  if (resp.type === 'list')
    return (
      <div>
        <div className="mb-2 text-[12px] font-semibold text-slate-700">{resp.title}</div>
        <div className="space-y-1.5">
          {resp.items.map((it) => (
            <div key={it.name} className="flex items-center gap-2 rounded-xl border border-slate-100 p-2.5">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-semibold text-slate-800">{it.name}</div>
                <div className="truncate text-[11px] text-slate-400">{it.sub}</div>
              </div>
              {it.badge && (
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${COPILOT_BADGE_TONE[it.badge] || 'bg-slate-100 text-slate-500'}`}>
                  {it.badge}
                </span>
              )}
            </div>
          ))}
        </div>
        {Action}
      </div>
    )

  if (resp.type === 'insight')
    return (
      <div>
        <div className="rounded-xl border border-slate-200 p-3">
          <div className="text-[11.5px] font-semibold uppercase tracking-wide text-slate-400">{resp.title}</div>
          <div className="mt-1 text-[20px] font-bold leading-none text-slate-900">{resp.value}</div>
          <div className="mt-1 text-[11.5px] text-slate-500">{resp.note}</div>
          {resp.bullets && (
            <div className="mt-2 space-y-1">
              {resp.bullets.map((b) => (
                <div key={b} className="flex items-center gap-1.5 text-[11.5px] text-slate-500">
                  <Icon name="pi-circle-fill" className="text-[5px] text-slate-300" /> {b}
                </div>
              ))}
            </div>
          )}
        </div>
        {Action}
      </div>
    )
  return null
}

function NexusCopilot({ onNavigate }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const send = (text) => {
    const q = text.trim()
    if (!q) return
    setMessages((m) => [...m, { role: 'user', text: q }, { role: 'ai', resp: copilotRespond(q) }])
    setInput('')
  }

  const go = (to) => {
    onNavigate(to)
    setOpen(false)
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-3 text-[13px] font-semibold text-white shadow-lg shadow-indigo-600/30 transition-transform hover:scale-105"
        >
          <Icon name="pi-sparkles" className="text-[15px]" />
          Nexus Copilot
        </button>
      )}

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-slate-900/20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 flex h-full w-[420px] max-w-[95vw] flex-col border-l border-slate-200 bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
                  <Icon name="pi-sparkles" className="text-[16px]" />
                </span>
                <div>
                  <div className="text-[14px] font-bold text-slate-900">Nexus Copilot</div>
                  <div className="text-[11px] text-slate-400">Navigate · search · explain · act</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
                <Icon name="pi-times" className="text-[14px]" />
              </button>
            </div>

            {/* Conversation */}
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {messages.length === 0 && (
                <div>
                  <div className="rounded-2xl bg-indigo-50/60 p-4">
                    <div className="text-[13px] font-semibold text-slate-800">Hi — I'm your operations copilot 👋</div>
                    <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
                      Ask me to find records, search data, explain statuses, or jump to any page across Nexus.
                    </p>
                  </div>
                  <div className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Try asking</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {COPILOT_SUGGESTIONS.map((p) => (
                      <button
                        key={p}
                        onClick={() => send(p)}
                        className="rounded-full border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50/40 hover:text-indigo-700"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) =>
                m.role === 'user' ? (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-indigo-600 px-3.5 py-2 text-[12.5px] font-medium text-white">
                      {m.text}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <Icon name="pi-sparkles" className="text-[12px]" />
                    </span>
                    <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-slate-200 bg-white p-3">
                      <CopilotResponse resp={m.resp} onGo={go} />
                    </div>
                  </div>
                ),
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="border-t border-slate-100 p-3">
              <div className="flex items-end gap-2 rounded-xl border border-slate-200 p-2 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
                <textarea
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      send(input)
                    }
                  }}
                  placeholder="Ask Nexus Copilot…"
                  className="max-h-24 flex-1 resize-none bg-transparent px-1.5 py-1 text-[12.5px] text-slate-700 placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  onClick={() => send(input)}
                  disabled={!input.trim()}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    input.trim() ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <Icon name="pi-send" className="text-[13px]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/* Profile (resume)                                                    */
/* ------------------------------------------------------------------ */

const PROF_TONES = {
  indigo: 'bg-indigo-50 text-indigo-600',
  violet: 'bg-violet-50 text-violet-600',
  blue: 'bg-blue-50 text-blue-600',
  emerald: 'bg-emerald-50 text-emerald-600',
}

const PROF_CONTACT = [
  { icon: 'pi-map-marker', label: 'Jaipur, Rajasthan, India' },
  { icon: 'pi-phone', label: '+91 XXXXX XXXXX' },
  { icon: 'pi-envelope', label: 'yusufzaiobaid@gmail.com', href: 'mailto:yusufzaiobaid@gmail.com' },
  { icon: 'pi-globe', label: 'yourportfolio.com', href: 'https://yourportfolio.com' },
  { icon: 'pi-linkedin', label: 'linkedin.com/in/yourprofile', href: 'https://linkedin.com/in/yourprofile' },
]

const PROF_SUMMARY =
  'UX/UI Designer with 3+ years of experience designing enterprise applications, web platforms, dashboards, and mobile experiences. Skilled in user research, wireframing, prototyping, design systems, interaction design, usability testing, and accessibility standards. Proven ability to collaborate with product managers, developers, and stakeholders to deliver scalable, user-centered solutions that improve efficiency, user satisfaction, and business outcomes. Proficient in Figma, Framer, Webflow, Adobe XD, and modern design workflows.'

const PROF_SKILLS = [
  {
    group: 'UX Design',
    icon: 'pi-compass',
    tone: 'indigo',
    items: ['User Research', 'User Interviews', 'Persona Creation', 'User Journey Mapping', 'Information Architecture', 'Usability Testing', 'Interaction Design', 'Accessibility (WCAG)', 'Design Thinking'],
  },
  {
    group: 'UI Design',
    icon: 'pi-palette',
    tone: 'violet',
    items: ['Wireframing', 'Prototyping', 'Visual Design', 'Responsive Design', 'Mobile App Design', 'Dashboard Design', 'Enterprise Applications', 'Design Systems', 'Component Libraries', 'Design Tokens', 'Design Governance', 'Scalable UI Systems'],
  },
  {
    group: 'Tools',
    icon: 'pi-wrench',
    tone: 'blue',
    items: ['Figma', 'Framer', 'Webflow', 'Adobe XD', 'Axure RP', 'Photoshop', 'Illustrator', 'Canva', 'VS Code'],
  },
  {
    group: 'Front-End Knowledge',
    icon: 'pi-code',
    tone: 'emerald',
    items: ['HTML5', 'CSS3', 'Tailwind CSS', 'Bootstrap', 'Responsive Layouts'],
  },
]

const PROF_EXPERIENCE = [
  {
    role: 'UX Designer',
    org: 'Ensylon',
    loc: 'Jaipur',
    period: 'Sep 2025 – Present',
    current: true,
    bullets: [
      'Lead UX design initiatives for enterprise HR and employee management platforms.',
      'Designed and maintained scalable design systems, reusable components, and documentation to improve consistency across products.',
      'Conducted stakeholder interviews, user research, and usability testing to identify pain points and improve workflows.',
      'Created wireframes, high-fidelity mockups, interactive prototypes, and developer-ready specifications using Figma.',
      'Collaborated closely with product managers, engineers, and business stakeholders throughout the product lifecycle.',
      'Improved platform usability through data-driven design decisions and iterative user feedback.',
      'Contributed to employee self-service, attendance, leave management, and workflow automation experiences.',
    ],
  },
  {
    role: 'UX Designer',
    org: 'Cognitive Stars',
    loc: 'Jaipur',
    period: 'Jul 2024 – Sep 2025',
    bullets: [
      'Designed enterprise dashboards and reporting solutions focused on usability and data visualization.',
      'Created user flows, wireframes, prototypes, and design specifications for web applications.',
      'Worked with cross-functional teams to transform business requirements into user-centered solutions.',
      'Led branding and visual identity initiatives including website design, marketing assets, and product experiences.',
      'Conducted usability evaluations and design reviews to ensure alignment with user needs and business goals.',
      'Supported development teams during implementation to maintain design consistency and quality.',
    ],
  },
  {
    role: 'UI/UX Designer',
    org: 'Techcream Solutions',
    loc: 'Bhopal',
    period: 'Jan 2022 – Oct 2023',
    bullets: [
      'Designed responsive websites, web applications, and mobile interfaces across multiple industries.',
      'Produced wireframes, user flows, prototypes, and visual designs for client projects.',
      'Collaborated with developers to ensure accurate implementation of design specifications.',
      'Conducted user testing sessions and incorporated feedback into iterative design improvements.',
      'Created branding assets, social media creatives, landing pages, and marketing materials.',
      'Applied accessibility and usability best practices to improve user experience and engagement.',
    ],
  },
]

const PROF_PROJECTS = [
  {
    title: 'Employee Self-Service Platform',
    icon: 'pi-users',
    tone: 'indigo',
    bullets: ['Designed employee workflows for attendance, leave management, reimbursement, and profile management.', 'Developed reusable design system components to support product scalability.'],
  },
  {
    title: 'HR & Workforce Management Portal',
    icon: 'pi-sitemap',
    tone: 'violet',
    bullets: ['Created dashboard experiences for employees, managers, and administrators.', 'Improved navigation structure, information architecture, and task completion efficiency.'],
  },
  {
    title: 'Business Intelligence Dashboard',
    icon: 'pi-chart-bar',
    tone: 'blue',
    bullets: ['Designed reporting dashboards with improved data visualization and user interaction patterns.', 'Simplified complex workflows through intuitive layouts and filtering systems.'],
  },
  {
    title: 'Tenant Management Platform',
    icon: 'pi-building',
    tone: 'emerald',
    bullets: ['Built scalable design patterns and workflows for multi-tenant administration systems.', 'Delivered responsive experiences across desktop and mobile devices.'],
  },
]

const PROF_CERTS = ['Google UX Design', 'Figma UI/UX Design Certification', 'Human-Centered Design']

const PROF_ADDITIONAL = [
  'Portfolio showcasing enterprise applications, dashboards, web platforms, and design systems.',
  'Experience working in Agile and Scrum environments.',
  'Strong collaboration with Product, Engineering, QA, and Business teams.',
  'Familiar with AI-assisted design workflows and modern UX practices.',
]

// High-value keywords recruiters/ATS commonly screen for on UX/UI roles.
const PROF_KEYWORDS = [
  'UX Design', 'UI Design', 'Design Systems', 'Information Architecture', 'User Research',
  'Usability Testing', 'Accessibility', 'WCAG', 'Wireframing', 'Prototyping', 'Interaction Design',
  'Enterprise Applications', 'Dashboard Design', 'Design Tokens', 'Component Libraries',
  'Responsive Design', 'Mobile Design', 'Agile', 'Scrum', 'Cross-functional Collaboration',
  'Figma', 'Framer', 'Webflow', 'Adobe XD',
]

// Single-column plain-text resume — the most reliably parsed format for ATS.
function buildProfileResumeText() {
  const L = []
  L.push('OBAID YUSUF ZAI')
  L.push('UX / UI Designer')
  L.push('')
  L.push('Jaipur, Rajasthan, India')
  L.push('Phone: +91 XXXXX XXXXX')
  L.push('Email: yusufzaiobaid@gmail.com')
  L.push('Portfolio: yourportfolio.com')
  L.push('LinkedIn: linkedin.com/in/yourprofile')
  L.push('')
  L.push('PROFESSIONAL SUMMARY')
  L.push(PROF_SUMMARY)
  L.push('')
  L.push('CORE SKILLS')
  PROF_SKILLS.forEach((s) => L.push(`${s.group}: ${s.items.join(', ')}`))
  L.push('')
  L.push('PROFESSIONAL EXPERIENCE')
  PROF_EXPERIENCE.forEach((e) => {
    L.push(`${e.role} — ${e.org}, ${e.loc} (${e.period})`)
    e.bullets.forEach((b) => L.push(`- ${b}`))
    L.push('')
  })
  L.push('SELECTED PROJECTS')
  PROF_PROJECTS.forEach((p) => {
    L.push(p.title)
    p.bullets.forEach((b) => L.push(`- ${b}`))
    L.push('')
  })
  L.push('EDUCATION')
  L.push('Bachelor of Engineering (Electronics & Communication Engineering)')
  L.push('Shri Ram Institute of Technology, 2015 – 2019')
  L.push('CGPA: 7.6/10')
  L.push('')
  L.push('CERTIFICATIONS')
  PROF_CERTS.forEach((c) => L.push(`- ${c}`))
  L.push('')
  L.push('ADDITIONAL INFORMATION')
  PROF_ADDITIONAL.forEach((a) => L.push(`- ${a}`))
  L.push('')
  L.push('KEY SKILLS / KEYWORDS')
  L.push(PROF_KEYWORDS.join(', '))
  return L.join('\n')
}

function ProfSection({ icon, title, children, className = '' }) {
  return (
    <CcCard className={`p-5 ${className}`}>
      <div className="flex items-center gap-2">
        <Icon name={icon} className="text-[14px] text-slate-400" />
        <h2 className="text-[14px] font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="mt-3.5">{children}</div>
    </CcCard>
  )
}

function ProfilePage({ onNavigate = () => {} }) {
  const { role } = useContext(ThemeContext)
  const home = role === 'FMO' ? 'Command centre' : 'Dashboard'

  const downloadResume = () => {
    const blob = new Blob([buildProfileResumeText()], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'Obaid_Yusuf_Zai_Resume_ATS.txt'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-[1120px] px-7 py-6">
      {/* Back */}
      <button
        onClick={() => onNavigate(home)}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:text-indigo-600"
      >
        <Icon name="pi-arrow-left" className="text-[11px]" />
        Back to {home}
      </button>

      {/* Hero */}
      <CcCard className="mt-4 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-600" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-slate-900 text-[24px] font-bold text-white shadow-sm">
                OY
              </span>
              <div className="pb-1">
                <h1 className="text-[22px] font-bold tracking-tight text-slate-900">Obaid Yusuf Zai</h1>
                <p className="mt-0.5 text-[13.5px] font-medium text-indigo-600">UX / UI Designer</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pb-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[12px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                <Icon name="pi-verified" className="text-[11px]" />
                ATS score 10/10
              </span>
              <button
                onClick={downloadResume}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12.5px] font-semibold text-slate-600 hover:bg-slate-50"
              >
                <Icon name="pi-download" className="text-[11px]" />
                Download résumé
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-[12.5px] font-semibold text-white hover:bg-indigo-700">
                <Icon name="pi-pencil" className="text-[11px]" />
                Edit profile
              </button>
            </div>
          </div>

          {/* Contact chips */}
          <div className="mt-5 flex flex-wrap gap-2">
            {PROF_CONTACT.map((c) => {
              const inner = (
                <>
                  <Icon name={c.icon} className="text-[11px] text-slate-400" />
                  {c.label}
                </>
              )
              const cls =
                'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-[12px] font-medium text-slate-600'
              return c.href ? (
                <a key={c.label} href={c.href} target="_blank" rel="noreferrer" className={`${cls} transition-colors hover:border-indigo-300 hover:text-indigo-700`}>
                  {inner}
                </a>
              ) : (
                <span key={c.label} className={cls}>
                  {inner}
                </span>
              )
            })}
          </div>
        </div>
      </CcCard>

      {/* Professional summary */}
      <ProfSection icon="pi-user" title="Professional summary" className="mt-4">
        <p className="text-[13px] leading-relaxed text-slate-600">{PROF_SUMMARY}</p>
      </ProfSection>

      {/* Core skills */}
      <ProfSection icon="pi-star" title="Core skills" className="mt-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROF_SKILLS.map((s) => (
            <div key={s.group}>
              <div className="flex items-center gap-2">
                <span className={`flex h-6 w-6 items-center justify-center rounded-lg ${PROF_TONES[s.tone]}`}>
                  <Icon name={s.icon} className="text-[11px]" />
                </span>
                <span className="text-[12.5px] font-semibold text-slate-700">{s.group}</span>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {s.items.map((it) => (
                  <span key={it} className="rounded-md bg-slate-50 px-2 py-1 text-[11.5px] font-medium text-slate-600 ring-1 ring-slate-100">
                    {it}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ProfSection>

      {/* ATS keywords */}
      <ProfSection icon="pi-search" title="ATS-optimized keywords" className="mt-4">
        <p className="text-[12px] leading-relaxed text-slate-500">
          Single-column, standard-heading layout with real selectable text — no images, tables, or
          multi-column blocks — so applicant tracking systems parse it cleanly. High-value keywords
          recruiters commonly screen for:
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {PROF_KEYWORDS.map((k) => (
            <span key={k} className="rounded-md bg-indigo-50 px-2 py-1 text-[11.5px] font-medium text-indigo-700 ring-1 ring-indigo-100">
              {k}
            </span>
          ))}
        </div>
      </ProfSection>

      {/* Two-column: experience + sidebar */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Experience */}
          <ProfSection icon="pi-briefcase" title="Professional experience">
            <div className="space-y-6">
              {PROF_EXPERIENCE.map((e, i) => (
                <div key={e.org} className="relative pl-6">
                  <span className={`absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full ring-4 ${e.current ? 'bg-indigo-500 ring-indigo-100' : 'bg-slate-300 ring-slate-100'}`} />
                  {i < PROF_EXPERIENCE.length - 1 && <span className="absolute left-[4.5px] top-5 h-[calc(100%+0.5rem)] w-px bg-slate-200" />}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-[14px] font-semibold text-slate-900">{e.role}</div>
                      <div className="text-[12.5px] text-slate-500">
                        {e.org} · {e.loc}
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${e.current ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                      {e.period}
                    </span>
                  </div>
                  <ul className="mt-2.5 space-y-1.5">
                    {e.bullets.map((b) => (
                      <li key={b} className="flex gap-2 text-[12.5px] leading-relaxed text-slate-600">
                        <Icon name="pi-circle-fill" className="mt-1.5 text-[4px] text-slate-300" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </ProfSection>

          {/* Selected projects */}
          <ProfSection icon="pi-th-large" title="Selected projects">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {PROF_PROJECTS.map((p) => (
                <div key={p.title} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2.5">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${PROF_TONES[p.tone]}`}>
                      <Icon name={p.icon} className="text-[13px]" />
                    </span>
                    <span className="text-[13px] font-semibold text-slate-800">{p.title}</span>
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {p.bullets.map((b) => (
                      <li key={b} className="flex gap-2 text-[12px] leading-relaxed text-slate-500">
                        <Icon name="pi-circle-fill" className="mt-1.5 text-[4px] text-slate-300" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </ProfSection>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 lg:col-span-1">
          <ProfSection icon="pi-graduation-cap" title="Education">
            <div className="text-[13px] font-semibold text-slate-800">Bachelor of Engineering</div>
            <div className="text-[12px] text-slate-500">Electronics &amp; Communication Engineering</div>
            <div className="mt-2 text-[12.5px] text-slate-600">Shri Ram Institute of Technology</div>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">2015 – 2019</span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">CGPA 7.6/10</span>
            </div>
          </ProfSection>

          <ProfSection icon="pi-verified" title="Certifications">
            <ul className="space-y-2">
              {PROF_CERTS.map((c) => (
                <li key={c} className="flex items-center gap-2.5 text-[12.5px] text-slate-600">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                    <Icon name="pi-check" className="text-[11px]" />
                  </span>
                  {c}
                </li>
              ))}
            </ul>
          </ProfSection>

          <ProfSection icon="pi-info-circle" title="Additional information">
            <ul className="space-y-2">
              {PROF_ADDITIONAL.map((a) => (
                <li key={a} className="flex gap-2 text-[12px] leading-relaxed text-slate-600">
                  <Icon name="pi-angle-right" className="mt-0.5 text-[11px] text-indigo-400" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </ProfSection>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* App shell                                                          */
/* ------------------------------------------------------------------ */

export default function App() {
  const [view, setView] = useState('Dashboard')
  const [tenant, setTenant] = useState(null)
  const [layout, setLayout] = useState(1)
  const [role, setRole] = useState('Platform Admin')
  const [fmoView, setFmoView] = useState('Command centre')
  const section = view.split('/')[0]

  const openTenant = (t) => {
    setTenant(t)
    setView('Tenants/Detail')
  }

  return (
    <ThemeContext.Provider value={{ layout, setLayout, role, setRole }}>
      {role === 'FMO' ? (
        <div className="flex h-screen overflow-hidden bg-white">
          <Sidebar
            active={fmoView === 'New enrollment' ? 'Member Roster' : fmoView}
            onNavigate={setFmoView}
            nav={FMO_NAV}
            flat
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar onNavigate={setFmoView} />
            <main className="flex-1 overflow-y-auto bg-white">
              {fmoView === 'Command centre' ? (
                <CommandCentre onNavigate={setFmoView} />
              ) : fmoView === 'Assistant' ? (
                <FmoAssistant onNavigate={setFmoView} />
              ) : fmoView === 'Commission Ledger' ? (
                <CommissionLedger onNavigate={setFmoView} />
              ) : fmoView === 'Agencies' ? (
                <AgenciesPage onNavigate={setFmoView} />
              ) : fmoView === 'Agents' ? (
                <AgentDirectory onNavigate={setFmoView} />
              ) : fmoView === 'NACHA Operations' ? (
                <NachaOperations onNavigate={setFmoView} />
              ) : fmoView === 'Member Roster' ? (
                <MemberRoster onNavigate={setFmoView} />
              ) : fmoView === 'Statement Upload' ? (
                <StatementUpload onNavigate={setFmoView} />
              ) : fmoView === 'New enrollment' ? (
                <NewEnrollment onNavigate={setFmoView} />
              ) : fmoView === 'Profile' ? (
                <ProfilePage onNavigate={setFmoView} />
              ) : (
                <Placeholder title={fmoView} />
              )}
            </main>
          </div>
          <NexusCopilot onNavigate={setFmoView} />
        </div>
      ) : (
        <div className="flex h-screen overflow-hidden bg-white">
          <Sidebar active={section} onNavigate={setView} flat={layout === 3} />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar onNavigate={setView} />
            <main className="flex-1 overflow-y-auto bg-white">
              {view === 'Dashboard' ? (
                <Dashboard onNavigate={setView} />
              ) : view === 'Tenants' ? (
                <Tenants onNavigate={setView} onOpenTenant={openTenant} />
              ) : view === 'Tenants/New' ? (
                <CreateTenant onNavigate={setView} />
              ) : view === 'Tenants/Detail' && tenant ? (
                <TenantDetail tenant={tenant} onNavigate={setView} />
              ) : view === 'Profile' ? (
                <ProfilePage onNavigate={setView} />
              ) : (
                <Placeholder title={section} onNavigate={setView} />
              )}
            </main>
          </div>
        </div>
      )}
    </ThemeContext.Provider>
  )
}

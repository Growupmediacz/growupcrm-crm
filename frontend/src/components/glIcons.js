// GrowUp (zadání 2027, kolo 2 – V1): jediná sada ikon = Lucide (ISC, lucide-static přes frappe-ui plugin `~icons/lucide/*`).
// GlIcon přijímá původní krátké názvy (zpětně kompatibilní) i přímo názvy Lucide. Nová ikona = jeden import + řádek v LUCIDE.
// Význam → ikona: zadani/2027/design/KOMPONENTY.md (kapitola Ikony) a docs/DESIGN.md v appce.
import AlarmClockOff from '~icons/lucide/alarm-clock-off'
import Archive from '~icons/lucide/archive'
import ArrowLeft from '~icons/lucide/arrow-left'
import ArrowRight from '~icons/lucide/arrow-right'
import ArrowUpRight from '~icons/lucide/arrow-up-right'
import Bell from '~icons/lucide/bell'
import Bot from '~icons/lucide/bot'
import Briefcase from '~icons/lucide/briefcase'
import Building from '~icons/lucide/building'
import Calendar from '~icons/lucide/calendar'
import CalendarCheck from '~icons/lucide/calendar-check'
import ChartColumn from '~icons/lucide/chart-column'
import Check from '~icons/lucide/check'
import CheckCheck from '~icons/lucide/check-check'
import ChevronDown from '~icons/lucide/chevron-down'
import ChevronLeft from '~icons/lucide/chevron-left'
import ChevronRight from '~icons/lucide/chevron-right'
import ChevronUp from '~icons/lucide/chevron-up'
import CircleAlert from '~icons/lucide/circle-alert'
import CircleCheck from '~icons/lucide/circle-check'
import CircleHelp from '~icons/lucide/circle-help'
import CircleX from '~icons/lucide/circle-x'
import Clock from '~icons/lucide/clock'
import Command from '~icons/lucide/command'
import Copy from '~icons/lucide/copy'
import CreditCard from '~icons/lucide/credit-card'
import Download from '~icons/lucide/download'
import Ellipsis from '~icons/lucide/ellipsis'
import ExternalLink from '~icons/lucide/external-link'
import Eye from '~icons/lucide/eye'
import EyeOff from '~icons/lucide/eye-off'
import FilePenLine from '~icons/lucide/file-pen-line'
import FileText from '~icons/lucide/file-text'
import Flag from '~icons/lucide/flag'
import Folder from '~icons/lucide/folder'
import Forward from '~icons/lucide/forward'
import Globe from '~icons/lucide/globe'
import GripVertical from '~icons/lucide/grip-vertical'
import Handshake from '~icons/lucide/handshake'
import Hash from '~icons/lucide/hash'
import House from '~icons/lucide/house'
import ImageIcon from '~icons/lucide/image'
import Inbox from '~icons/lucide/inbox'
import Info from '~icons/lucide/info'
import Kanban from '~icons/lucide/kanban'
import KeyRound from '~icons/lucide/key-round'
import LayoutDashboard from '~icons/lucide/layout-dashboard'
import Lightbulb from '~icons/lucide/lightbulb'
import Link from '~icons/lucide/link'
import List from '~icons/lucide/list'
import ListFilter from '~icons/lucide/list-filter'
import LoaderCircle from '~icons/lucide/loader-circle'
import Lock from '~icons/lucide/lock'
import LogOut from '~icons/lucide/log-out'
import Mail from '~icons/lucide/mail'
import MailOpen from '~icons/lucide/mail-open'
import MapPin from '~icons/lucide/map-pin'
import Maximize2 from '~icons/lucide/maximize-2'
import Menu from '~icons/lucide/menu'
import MessageSquareText from '~icons/lucide/message-square-text'
import NotebookPen from '~icons/lucide/notebook-pen'
import PanelRight from '~icons/lucide/panel-right'
import Paperclip from '~icons/lucide/paperclip'
import Pause from '~icons/lucide/pause'
import PencilLine from '~icons/lucide/pencil-line'
import Phone from '~icons/lucide/phone'
import PhoneIncoming from '~icons/lucide/phone-incoming'
import PhoneOutgoing from '~icons/lucide/phone-outgoing'
import Play from '~icons/lucide/play'
import Plus from '~icons/lucide/plus'
import RefreshCw from '~icons/lucide/refresh-cw'
import Reply from '~icons/lucide/reply'
import ReplyAll from '~icons/lucide/reply-all'
import Search from '~icons/lucide/search'
import Send from '~icons/lucide/send'
import Server from '~icons/lucide/server'
import Settings from '~icons/lucide/settings'
import ShieldCheck from '~icons/lucide/shield-check'
import SkipForward from '~icons/lucide/skip-forward'
import SlidersHorizontal from '~icons/lucide/sliders-horizontal'
import Sparkles from '~icons/lucide/sparkles'
import SquareCheckBig from '~icons/lucide/square-check-big'
import Star from '~icons/lucide/star'
import Target from '~icons/lucide/target'
import Trash2 from '~icons/lucide/trash-2'
import TriangleAlert from '~icons/lucide/triangle-alert'
import Undo2 from '~icons/lucide/undo-2'
import Upload from '~icons/lucide/upload'
import User from '~icons/lucide/user'
import Users from '~icons/lucide/users'
import WandSparkles from '~icons/lucide/wand-sparkles'
import WifiOff from '~icons/lucide/wifi-off'
import ArrowUpDown from '~icons/lucide/arrow-up-down'
import Columns3 from '~icons/lucide/columns-3'
import SlidersVertical from '~icons/lucide/sliders-vertical'
import FolderPlus from '~icons/lucide/folder-plus'
import X from '~icons/lucide/x'

// Názvy Lucide → komponenta
export const LUCIDE = {
  'alarm-clock-off': AlarmClockOff,
  archive: Archive,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'arrow-up-right': ArrowUpRight,
  bell: Bell,
  bot: Bot,
  briefcase: Briefcase,
  building: Building,
  calendar: Calendar,
  'calendar-check': CalendarCheck,
  'chart-column': ChartColumn,
  check: Check,
  'check-check': CheckCheck,
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'chevron-up': ChevronUp,
  'circle-alert': CircleAlert,
  'circle-check': CircleCheck,
  'circle-help': CircleHelp,
  'circle-x': CircleX,
  clock: Clock,
  command: Command,
  copy: Copy,
  'credit-card': CreditCard,
  download: Download,
  ellipsis: Ellipsis,
  'external-link': ExternalLink,
  eye: Eye,
  'eye-off': EyeOff,
  'file-pen-line': FilePenLine,
  'file-text': FileText,
  flag: Flag,
  folder: Folder,
  forward: Forward,
  globe: Globe,
  'grip-vertical': GripVertical,
  handshake: Handshake,
  hash: Hash,
  house: House,
  image: ImageIcon,
  inbox: Inbox,
  info: Info,
  kanban: Kanban,
  'key-round': KeyRound,
  'layout-dashboard': LayoutDashboard,
  lightbulb: Lightbulb,
  link: Link,
  list: List,
  'list-filter': ListFilter,
  'loader-circle': LoaderCircle,
  lock: Lock,
  'log-out': LogOut,
  mail: Mail,
  'mail-open': MailOpen,
  'map-pin': MapPin,
  'maximize-2': Maximize2,
  menu: Menu,
  'message-square-text': MessageSquareText,
  'notebook-pen': NotebookPen,
  'panel-right': PanelRight,
  paperclip: Paperclip,
  pause: Pause,
  'pencil-line': PencilLine,
  phone: Phone,
  'phone-incoming': PhoneIncoming,
  'phone-outgoing': PhoneOutgoing,
  play: Play,
  plus: Plus,
  'refresh-cw': RefreshCw,
  reply: Reply,
  'reply-all': ReplyAll,
  search: Search,
  send: Send,
  server: Server,
  settings: Settings,
  'shield-check': ShieldCheck,
  'skip-forward': SkipForward,
  'sliders-horizontal': SlidersHorizontal,
  sparkles: Sparkles,
  'square-check-big': SquareCheckBig,
  star: Star,
  target: Target,
  'trash-2': Trash2,
  'triangle-alert': TriangleAlert,
  'undo-2': Undo2,
  upload: Upload,
  user: User,
  users: Users,
  'wand-sparkles': WandSparkles,
  'wifi-off': WifiOff,
  'arrow-up-down': ArrowUpDown,
  'columns-3': Columns3,
  'sliders-vertical': SlidersVertical,
  'folder-plus': FolderPlus,
  x: X,
}

// Původní krátké názvy (vlastní kresby do 1. kola) → Lucide. Volající se nemusí měnit.
export const ALIASES = {
  alert: 'triangle-alert',
  arrow: 'arrow-right',
  brief: 'briefcase',
  cal: 'calendar',
  card: 'credit-card',
  chart: 'chart-column',
  cmd: 'command',
  doc: 'file-text',
  down: 'chevron-down',
  edit: 'pencil-line',
  external: 'external-link',
  filter: 'list-filter',
  gear: 'settings',
  grid: 'layout-dashboard',
  grip: 'grip-vertical',
  home: 'house',
  key: 'key-round',
  left: 'chevron-left',
  logo: 'arrow-up-right',
  logout: 'log-out',
  more: 'ellipsis',
  pin: 'map-pin',
  refresh: 'refresh-cw',
  right: 'chevron-right',
  skip: 'skip-forward',
  sliders: 'sliders-horizontal',
  spark: 'lightbulb',
  trash: 'trash-2',
  undo: 'undo-2',
  up: 'arrow-up-right',
  // názvy feather / frappe-ui, které se dřív předávaly do našich komponent
  'more-horizontal': 'ellipsis',
  'edit-2': 'pencil-line',
  'check-square': 'square-check-big',
  'alert-triangle': 'triangle-alert',
  'alert-circle': 'circle-alert',
  'help-circle': 'circle-help',
}

export function glIconComponent(name) {
  if (!name) return null
  return LUCIDE[name] || LUCIDE[ALIASES[name]] || null
}

// Náhrada upstream ikon (components/Icons/*.vue) v lištách nad seznamy: stejné rozhraní (komponenta, třídy h-4),
// kresba Lucide 16 px s tahem 1,8. Použití: `const FilterIcon = glLucide('list-filter')` místo importu z Icons/.
import { defineComponent, h, markRaw } from 'vue'
export function glLucide(name, size = 16) {
  return markRaw(
    defineComponent({
      name: `GlLucide_${name}`,
      inheritAttrs: false,
      setup(_, { attrs }) {
        return () => {
          const c = glIconComponent(name)
          return c ? h(c, { width: size, height: size, 'stroke-width': 1.8, ...attrs, 'aria-hidden': 'true' }) : null
        }
      },
    }),
  )
}

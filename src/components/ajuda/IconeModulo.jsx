import {
    Rocket, Building2, ChartGantt, ClipboardList, Camera, TriangleAlert, Users,
    Banknote, Wallet, Package, Calculator, Eye, UserCog, Route, BookOpen,
} from 'lucide-react';

// Os módulos guardam o nome do ícone do app (Material). Aqui vira o ícone equivalente do site.
const ICONES = {
    rocket: Rocket,
    home_work: Building2,
    timeline: ChartGantt,
    assignment: ClipboardList,
    photo_library: Camera,
    report_problem: TriangleAlert,
    groups: Users,
    payments: Banknote,
    account_balance_wallet: Wallet,
    inventory_2: Package,
    calculate: Calculator,
    visibility: Eye,
    manage_accounts: UserCog,
    route: Route,
};

export default function IconeModulo({ nome, size = 22 }) {
    const Icone = ICONES[nome] ?? BookOpen;
    return <Icone size={size} aria-hidden="true" />;
}

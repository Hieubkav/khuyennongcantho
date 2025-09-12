import { Header } from "@/components/layout/header";
import { TopNav } from "@/components/layout/top-nav";
import { Main } from "@/components/layout/main";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const links = [
    { title: "Overview", href: "/dashboard" },
    { title: "Units", href: "/units" },
    { title: "Reports", href: "/dashboard/reports", disabled: true },
  ];

  return (
    <AuthenticatedLayout>
      <Header fixed>
        <TopNav links={links} />
        <div className="ms-auto flex items-center space-x-2 sm:space-x-3 flex-nowrap">
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>{children}</Main>
    </AuthenticatedLayout>
  );
}

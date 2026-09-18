import type { JSX } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  AppShell as OxygenAppShell,
  Header,
  Sidebar,
  Footer,
  UserMenu,
  ColorSchemeToggle,
  Divider,
} from "@wso2/oxygen-ui";
import { CheckSquare, LogOut } from "@wso2/oxygen-ui-icons-react";
import { APP_NAME } from "../appName";
import { useAuthz, useHeldRoles } from "../authz/gates";
import { signOut } from "../authz/session";

/**
 * The signed-in app shell (wireframes.dsl: `navbar "Todo"`). The DSL draws no
 * sidebar because this app has exactly one screen, but the shell is not
 * negotiable (oxygen-ui-design-system) — the sidebar carries that one item,
 * active and pointing at itself, which is correctly inert.
 */
export function AppShell(): JSX.Element {
  const { pathname } = useLocation();
  const { username } = useAuthz();
  const roles = useHeldRoles();

  return (
    <OxygenAppShell>
      <OxygenAppShell.Navbar>
        <Header>
          <Header.Toggle />
          <Header.Brand>
            <Header.BrandTitle>{APP_NAME}</Header.BrandTitle>
          </Header.Brand>
          <Header.Spacer />
          <Header.Actions>
            <ColorSchemeToggle />
            <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
            <UserMenu>
              <UserMenu.Trigger name={username || "Signed in"} />
              <UserMenu.Header
                name={username || "Signed in"}
                email={username || ""}
                role={roles[0]}
              />
              <UserMenu.Logout icon={<LogOut size={16} />} onClick={() => void signOut()} />
            </UserMenu>
          </Header.Actions>
        </Header>
      </OxygenAppShell.Navbar>

      <OxygenAppShell.Sidebar>
        <Sidebar activeItem="todolist">
          <Sidebar.Nav>
            <Sidebar.Category>
              <Sidebar.Item id="todolist" link={<Link to="/todos" />}>
                <Sidebar.ItemIcon>
                  <CheckSquare size={18} />
                </Sidebar.ItemIcon>
                <Sidebar.ItemLabel>Todo</Sidebar.ItemLabel>
              </Sidebar.Item>
            </Sidebar.Category>
          </Sidebar.Nav>
        </Sidebar>
      </OxygenAppShell.Sidebar>

      <OxygenAppShell.Main>
        <Outlet key={pathname} />
      </OxygenAppShell.Main>

      <OxygenAppShell.Footer>
        <Footer>
          <Footer.Copyright>© WSO2 LLC</Footer.Copyright>
        </Footer>
      </OxygenAppShell.Footer>
    </OxygenAppShell>
  );
}

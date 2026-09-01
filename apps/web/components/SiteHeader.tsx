import { BrandMark } from "./BrandMark";
import { HeaderDirectionControl } from "./HeaderDirectionControl";
import { NavMenu } from "./NavMenu";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <BrandMark />
        <NavMenu />
        <HeaderDirectionControl />
      </div>
    </header>
  );
}

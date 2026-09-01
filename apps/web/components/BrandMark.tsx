import Link from "next/link";
import Image from "next/image";

export function BrandMark() {
  return (
    <Link className="brand-mark" href="/" aria-label="Bridge home">
      <Image src="/bridge-mark.svg" alt="" height={38} width={61} />
      <span>BRIDGE</span>
    </Link>
  );
}

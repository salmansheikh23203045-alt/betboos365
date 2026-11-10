import { HomeDesktop } from "@/components/home/HomeDesktop";
import { HomeMobile } from "@/components/home/HomeMobile";
import { PaymentMethods } from "@/components/payments/PaymentMethods";
import { PAYMENT_METHODS } from "@/data/mock";

/* TCL11 homepage. Structure follows the reference image:
 * header (layout) → ticker (layout, desktop) → body → payment methods → footer (layout).
 * Developer design-system showcase lives at /dev/design-system (not linked, disabled in production). */
export default function HomePage() {
  return (
    <>
      <HomeDesktop />
      <HomeMobile />
      <div className="mt-2">
        <PaymentMethods methods={PAYMENT_METHODS} />
      </div>
    </>
  );
}

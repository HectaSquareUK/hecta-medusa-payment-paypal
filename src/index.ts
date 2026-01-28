import { ModuleProvider, Modules } from "@medusajs/framework/utils";
import PayPalProviderService from "./service";

export default ModuleProvider(Modules.PAYMENT, {
  services: [PayPalProviderService],
});

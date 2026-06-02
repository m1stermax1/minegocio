import { ElectronicBilling } from "./afip";

async function test() {
  try {
    const lastVoucher =
      await ElectronicBilling.getLastVoucher(1, 11);

    console.log("Último comprobante:", lastVoucher);
  } catch (err) {
    console.error(err);
  }
}

test();
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function detectSerialPorts() {
  const isWindows = process.platform === "win32";
  const isLinux = process.platform === "linux";
  const isMac = process.platform === "darwin";

  console.log("\n📡 Detectando puertos serie disponibles...");
  console.log(`   Sistema: ${process.platform}`);

  try {
    if (isWindows) {
      // En Windows, lista los puertos COM via PowerShell
      const { stdout } = await execAsync(
        `powershell -Command "Get-WMIObject Win32_SerialPort | Select-Object DeviceID, Description | Format-Table -AutoSize"`
      );
      console.log("\n   Puertos COM encontrados:");
      console.log(stdout || "   (ninguno detectado)");
    } else if (isLinux) {
      const { stdout } = await execAsync(
        `ls /dev/ttyUSB* /dev/ttyACM* /dev/serial/by-id/* 2>/dev/null || echo "(ninguno)"`
      );
      console.log("\n   Puertos serie encontrados:");
      stdout.split("\n").filter(Boolean).forEach(p => console.log(`   - ${p}`));
    } else if (isMac) {
      const { stdout } = await execAsync(`ls /dev/tty.* /dev/cu.* 2>/dev/null || echo "(ninguno)"`);
      console.log("\n   Puertos serie encontrados:");
      stdout.split("\n").filter(Boolean).forEach(p => console.log(`   - ${p}`));
    }
  } catch (e) {
    console.log("   Error al listar puertos:", e.message);
  }
}

async function detectNiimprint() {
  console.log("\n🐍 Verificando instalación de niimprint...");
  try {
    const { stdout } = await execAsync("python -m niimprint --help");
    console.log("   ✅ niimprint está instalado");

    // Extraer modelos soportados del help
    const modelMatch = stdout.match(/\[([^\]]+)\]/);
    if (modelMatch) {
      console.log(`   Modelos soportados: ${modelMatch[1]}`);
    }
  } catch (e) {
    console.log("   ❌ niimprint NO encontrado. Instalalo con:");
    console.log("      pip install niimprint");
    console.log("      o: pip install git+https://github.com/AndBondStyle/niimprint");
  }
}

async function detectBluetooth() {
  const isLinux = process.platform === "linux";
  const isMac = process.platform === "darwin";

  console.log("\n🔵 Dispositivos Bluetooth Niimbot pareados...");
  try {
    if (isLinux) {
      const { stdout } = await execAsync(`bluetoothctl devices 2>/dev/null`);
      const niim = stdout.split("\n").filter(l => /niimbot/i.test(l));
      if (niim.length) {
        niim.forEach(d => console.log("   -", d.trim()));
      } else {
        console.log("   (ninguno detectado o no es Linux con bluetoothctl)");
      }
    } else if (isMac) {
      console.log("   (en Mac usá: system_profiler SPBluetoothDataType)");
    } else {
      console.log("   (en Windows revisá el Administrador de Dispositivos)");
    }
  } catch {
    console.log("   (bluetoothctl no disponible)");
  }
}

async function main() {
  console.log("=".repeat(50));
  console.log("   DIAGNÓSTICO IMPRESORA NIIMBOT");
  console.log("=".repeat(50));

  await detectNiimprint();
  await detectSerialPorts();
  await detectBluetooth();

  console.log("\n📋 Variables de entorno sugeridas (.env):");
  console.log("   NIIM_MODEL=d110         # ajustá según tu modelo");
  console.log("   NIIM_CONN=usb           # usb | bluetooth");
  console.log("   NIIM_ADDR=              # puerto detectado arriba, o vacío para auto-detect");
  console.log("   NIIM_DENSITY=3          # 1-5");
  console.log("=".repeat(50) + "\n");
}

main();
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.mayank.transportledger",
  appName: "Transport Ledger",
  webDir: "out",
  android: {
    allowMixedContent: false,
  },
};

export default config;

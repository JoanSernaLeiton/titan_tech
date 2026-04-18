import { describe, expect, it } from "vitest";

import { buildReportArtifacts } from "@/features/dashboard/lib/report-builder";
import type { SelectCustomerAgreementVariable } from "@/shared/db/customer-agreement-variables.schema";
import type { SelectCustomerDevice } from "@/shared/db/customer-devices.schema";

function makeDevice(id: string): SelectCustomerDevice {
  return {
    id,
    apiParams: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    customerId: "customer-1",
    deviceName: `Device ${id}`,
    deviceType: "inverter",
    externalId: `ext-${id}`,
    isEnabled: true,
    providerId: "provider-1",
  };
}

function makeAgreementVariable(
  variable: SelectCustomerAgreementVariable["variable"],
  monthlyTarget: string
): SelectCustomerAgreementVariable {
  return {
    id: `${variable}-1`,
    customerId: "customer-1",
    enabled: true,
    monthlyTarget,
    unit: "kWh",
    variable,
  };
}

describe("buildReportArtifacts", () => {
  it("returns ready report when device and agreement data exist", () => {
    // Arrange
    const devices = [makeDevice("a"), makeDevice("b")];
    const variables = [
      makeAgreementVariable("energia_ahorrada", "100"),
      makeAgreementVariable("performance_ratio", "200"),
    ];

    // Act
    const result = buildReportArtifacts(devices, variables);

    // Assert
    expect(result.status).toBe("ready");
    expect(result.warnings).toHaveLength(0);
    expect(result.metrics.EnergiaGenerada).toBeDefined();
    expect(result.pdfContent.includes("REPORTE")).toBe(true);
  });

  it("returns partial report with warnings when no devices are available", () => {
    // Arrange
    const devices: SelectCustomerDevice[] = [];
    const variables = [makeAgreementVariable("energia_ahorrada", "100")];

    // Act
    const result = buildReportArtifacts(devices, variables);

    // Assert
    expect(result.status).toBe("partial");
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.metrics.EnergiaGenerada?.actual).toBeNull();
    expect(result.metrics.EnergiaGenerada?.contractCompliance).toBe("na");
  });
});

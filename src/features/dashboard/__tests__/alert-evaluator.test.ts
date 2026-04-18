import { describe, it, expect } from "vitest";

import { evaluateThresholds, evaluateAgreementVariables, evaluateAlerts } from "@/features/dashboard/lib/alert-evaluator";
import type { SelectCustomerAgreementVariable } from "@/shared/db/customer-agreement-variables.schema";
import type { SelectCustomerThreshold } from "@/shared/db/customer-thresholds.schema";

describe("alert-evaluator", () => {
  describe("evaluateThresholds", () => {
    it("detects threshold breach when value < min_value", () => {
      const metrics = { efficiency: 50 };
      const thresholds: SelectCustomerThreshold[] = [
        {
          id: "1",
          customerId: "cust1",
          metric: "efficiency",
          minValue: "75",
          maxValue: null,
          isEnabled: true,
        },
      ];

      const breaches = evaluateThresholds(metrics, thresholds);

      expect(breaches).toHaveLength(1);
      expect(breaches[0]).toMatchObject({
        metric: "efficiency",
        triggeredValue: 50,
        thresholdValue: 75,
        alertType: "threshold_breach",
      });
    });

    it("does not breach when value >= min_value", () => {
      const metrics = { efficiency: 80 };
      const thresholds: SelectCustomerThreshold[] = [
        {
          id: "1",
          customerId: "cust1",
          metric: "efficiency",
          minValue: "75",
          maxValue: null,
          isEnabled: true,
        },
      ];

      const breaches = evaluateThresholds(metrics, thresholds);

      expect(breaches).toHaveLength(0);
    });

    it("ignores disabled thresholds", () => {
      const metrics = { efficiency: 50 };
      const thresholds: SelectCustomerThreshold[] = [
        {
          id: "1",
          customerId: "cust1",
          metric: "efficiency",
          minValue: "75",
          maxValue: null,
          isEnabled: false,
        },
      ];

      const breaches = evaluateThresholds(metrics, thresholds);

      expect(breaches).toHaveLength(0);
    });

    it("ignores missing metrics", () => {
      const metrics = { other_metric: 100 };
      const thresholds: SelectCustomerThreshold[] = [
        {
          id: "1",
          customerId: "cust1",
          metric: "efficiency",
          minValue: "75",
          maxValue: null,
          isEnabled: true,
        },
      ];

      const breaches = evaluateThresholds(metrics, thresholds);

      expect(breaches).toHaveLength(0);
    });

    it("does not breach when boolean metric is true (online)", () => {
      const metrics = { device_online: true };
      const thresholds: SelectCustomerThreshold[] = [
        {
          id: "1",
          customerId: "cust1",
          metric: "device_online",
          minValue: "1",
          maxValue: null,
          isEnabled: true,
        },
      ];

      const breaches = evaluateThresholds(metrics, thresholds);

      expect(breaches).toHaveLength(0);
    });

    it("breaches when boolean metric is false (offline)", () => {
      const metrics = { device_online: false };
      const thresholds: SelectCustomerThreshold[] = [
        {
          id: "1",
          customerId: "cust1",
          metric: "device_online",
          minValue: "1",
          maxValue: null,
          isEnabled: true,
        },
      ];

      const breaches = evaluateThresholds(metrics, thresholds);

      expect(breaches).toHaveLength(1);
      expect(breaches[0]).toMatchObject({
        metric: "device_online",
        triggeredValue: 0,
        thresholdValue: 1,
        alertType: "threshold_breach",
      });
    });

    it("evaluates multiple thresholds", () => {
      const metrics = { efficiency: 50, uptime: 95 };
      const thresholds: SelectCustomerThreshold[] = [
        {
          id: "1",
          customerId: "cust1",
          metric: "efficiency",
          minValue: "75",
          maxValue: null,
          isEnabled: true,
        },
        {
          id: "2",
          customerId: "cust1",
          metric: "uptime",
          minValue: "99",
          maxValue: null,
          isEnabled: true,
        },
      ];

      const breaches = evaluateThresholds(metrics, thresholds);

      expect(breaches).toHaveLength(2);
    });
  });

  describe("evaluateAgreementVariables", () => {
    it("detects agreement breach when daily energy < monthly_target / 30", () => {
      const metrics = { energy_today_kwh: 5 };
      const variables: SelectCustomerAgreementVariable[] = [
        {
          id: "1",
          customerId: "cust1",
          variable: "energia_ahorrada",
          monthlyTarget: "600",
          unit: "kWh",
          enabled: true,
        },
      ];

      const breaches = evaluateAgreementVariables(metrics, variables);

      expect(breaches).toHaveLength(1);
      expect(breaches[0]).toMatchObject({
        metric: "energy_today_kwh",
        triggeredValue: 5,
        thresholdValue: 20, // 600 / 30
        alertType: "agreement_breach",
      });
    });

    it("does not breach when daily energy >= monthly_target / 30", () => {
      const metrics = { energy_today_kwh: 25 };
      const variables: SelectCustomerAgreementVariable[] = [
        {
          id: "1",
          customerId: "cust1",
          variable: "energia_ahorrada",
          monthlyTarget: "600",
          unit: "kWh",
          enabled: true,
        },
      ];

      const breaches = evaluateAgreementVariables(metrics, variables);

      expect(breaches).toHaveLength(0);
    });

    it("ignores disabled agreement variables", () => {
      const metrics = { energy_today_kwh: 5 };
      const variables: SelectCustomerAgreementVariable[] = [
        {
          id: "1",
          customerId: "cust1",
          variable: "energia_ahorrada",
          monthlyTarget: "600",
          unit: "kWh",
          enabled: false,
        },
      ];

      const breaches = evaluateAgreementVariables(metrics, variables);

      expect(breaches).toHaveLength(0);
    });

    it("ignores non-energia_ahorrada variables", () => {
      const metrics = { energy_today_kwh: 5 };
      const variables: SelectCustomerAgreementVariable[] = [
        {
          id: "1",
          customerId: "cust1",
          variable: "dinero_ahorrado",
          monthlyTarget: "1000",
          unit: "COP",
          enabled: true,
        },
      ];

      const breaches = evaluateAgreementVariables(metrics, variables);

      expect(breaches).toHaveLength(0);
    });

    it("ignores missing energy_today_kwh metric", () => {
      const metrics = { other_metric: 100 };
      const variables: SelectCustomerAgreementVariable[] = [
        {
          id: "1",
          customerId: "cust1",
          variable: "energia_ahorrada",
          monthlyTarget: "600",
          unit: "kWh",
          enabled: true,
        },
      ];

      const breaches = evaluateAgreementVariables(metrics, variables);

      expect(breaches).toHaveLength(0);
    });

    it("ignores non-numeric energy values", () => {
      const metrics = { energy_today_kwh: true };
      const variables: SelectCustomerAgreementVariable[] = [
        {
          id: "1",
          customerId: "cust1",
          variable: "energia_ahorrada",
          monthlyTarget: "600",
          unit: "kWh",
          enabled: true,
        },
      ];

      const breaches = evaluateAgreementVariables(metrics, variables);

      expect(breaches).toHaveLength(0);
    });

    it("evaluates multiple agreement variables", () => {
      const metrics = { energy_today_kwh: 5 };
      const variables: SelectCustomerAgreementVariable[] = [
        {
          id: "1",
          customerId: "cust1",
          variable: "energia_ahorrada",
          monthlyTarget: "600",
          unit: "kWh",
          enabled: true,
        },
        {
          id: "2",
          customerId: "cust1",
          variable: "energia_ahorrada",
          monthlyTarget: "900",
          unit: "kWh",
          enabled: true,
        },
      ];

      const breaches = evaluateAgreementVariables(metrics, variables);

      expect(breaches).toHaveLength(2);
    });
  });

  describe("evaluateAlerts", () => {
    it("combines threshold and agreement breaches", () => {
      const metrics = { efficiency: 50, energy_today_kwh: 5 };
      const thresholds: SelectCustomerThreshold[] = [
        {
          id: "1",
          customerId: "cust1",
          metric: "efficiency",
          minValue: "75",
          maxValue: null,
          isEnabled: true,
        },
      ];
      const variables: SelectCustomerAgreementVariable[] = [
        {
          id: "1",
          customerId: "cust1",
          variable: "energia_ahorrada",
          monthlyTarget: "600",
          unit: "kWh",
          enabled: true,
        },
      ];

      const breaches = evaluateAlerts(metrics, thresholds, variables);

      expect(breaches).toHaveLength(2);
      expect(breaches[0]).toBeDefined();
      expect(breaches[0]?.alertType).toBe("threshold_breach");
      expect(breaches[1]).toBeDefined();
      expect(breaches[1]?.alertType).toBe("agreement_breach");
    });

    it("returns empty array when no breaches", () => {
      const metrics = { efficiency: 80, energy_today_kwh: 25 };
      const thresholds: SelectCustomerThreshold[] = [
        {
          id: "1",
          customerId: "cust1",
          metric: "efficiency",
          minValue: "75",
          maxValue: null,
          isEnabled: true,
        },
      ];
      const variables: SelectCustomerAgreementVariable[] = [
        {
          id: "1",
          customerId: "cust1",
          variable: "energia_ahorrada",
          monthlyTarget: "600",
          unit: "kWh",
          enabled: true,
        },
      ];

      const breaches = evaluateAlerts(metrics, thresholds, variables);

      expect(breaches).toHaveLength(0);
    });
  });
});

# Feature: Modulo de Reportes v1
> Created: 2026-04-18-0337 | Status: ready-to-build

## Context
El equipo necesita reemplazar un proceso manual y repetitivo de recoleccion y consolidacion de datos desde plataformas de fabricantes para generar reportes de valor para clientes y soporte comercial. Esta feature prioriza la generacion mensual para clientes con salida presentable y agrega un ad-hoc comercial basico para acelerar propuestas con informacion comparable de proyectos del mismo cliente.

## Assumptions
- Ninguna. Requerimientos confirmados explicitamente por el usuario durante discovery.

---

## Functional Task List (BA-owned)

### User Story
As a usuario interno y cliente autenticado, I want generar y consultar reportes mensuales y ad-hoc basicos para mi alcance permitido so that pueda validar cumplimiento contractual y soportar decisiones comerciales con datos confiables.

### Acceptance Criteria
- [ ] AC1: Al generar un reporte mensual por cliente y periodo, el usuario obtiene archivos PDF y XLSX con cumplimiento de compromisos contractuales, energia (kWh), ahorros economicos, PR, uptime y CO2 mitigado.
- [ ] AC2: Si faltan datos de proveedor o dispositivo, el sistema permite emitir reporte parcial con advertencias visibles y marca los campos faltantes como N/A (sin estimaciones automaticas).
- [ ] AC3: El sistema nunca mezcla datos entre clientes o proyectos y nunca oculta faltantes de informacion.
- [ ] AC4: Los calculos de cumplimiento contractual aplican validacion estricta por cliente segun reglas definidas (unidades y limites).
- [ ] AC5: El modulo soporta un volumen medio (50 a 500 clientes) con busqueda y filtros basicos para localizar reportes.
- [ ] AC6: El ad-hoc comercial basico v1 permite comparacion entre multiples proyectos del mismo cliente.
- [ ] AC7: Control de acceso v1: un rol interno y rol cliente; el cliente solo puede ver/descargar sus propios reportes.
- [ ] AC8: Solo busque informacion persistida en la DB, crea tablas o structuras que sean necesarias para generar estos reportes
- [ ] AC9: El periodo mensual se define como mes calendario (inicio a fin de mes) usando zona horaria local del proyecto/cliente.
- [ ] AC10: Generacion hibrida en UX: sincrona para casos livianos y asincrona para reportes pesados.

### Functional Test Cases
- [ ] TC1 (AC1): Usuario selecciona cliente y mes; obtiene PDF y XLSX con todas las secciones metricas requeridas.
- [ ] TC2 (AC2): Si faltan datos de uno o mas dispositivos, el reporte se genera parcial, muestra advertencias y metricas faltantes como N/A.
- [ ] TC3 (AC3): Verificacion de salida confirma que no hay datos cruzados entre clientes/proyectos ni faltantes silenciosos.
- [ ] TC4 (AC4): Para un cliente con reglas contractuales especificas, el calculo de cumplimiento respeta unidades y limites configurados.
- [ ] TC5 (AC5): En un conjunto de 50-500 clientes, el usuario localiza reportes con filtros y busqueda basica sin perder trazabilidad.
- [ ] TC6 (AC6): Usuario comercial genera reporte ad-hoc comparando multiples proyectos del mismo cliente.
- [ ] TC7 (AC7): Cliente autenticado intenta acceder a reporte de otro cliente y el sistema lo bloquea.
- [ ] TC8 (AC8): En un caso donde parte de datos proviene de plataforma fabricante, el reporte integra correctamente datos internos y externos.
- [ ] TC9 (AC9): Reporte de un mes respeta cortes de zona horaria local del proyecto/cliente.
- [ ] TC10 (AC10): Casos livianos se generan en flujo sincrono; casos pesados se encolan y finalizan con estado descargable.

---

## Technical Task List (TL-owned)

### Complexity Assessment
L (Large): la feature combina control de acceso multi-tenant, calculo contractual estricto, integracion hibrida con fuentes externas, persistencia historica auditable y exportacion dual PDF/XLSX, ademas de UX hibrida sincrona/asyncrona y capacidad de busqueda para volumen medio.

### Parallel Execution Plan

#### Group A — Foundation (runs first, no dependencies)
- [ ] A1: Definir modelo de datos de reportes historicos/auditables (entidad de reporte, items metricos, warnings, estado, version, customer_id, periodo, metadatos de origen).
- [ ] A2: Definir y documentar reglas formales de calculo contractual (formulas, unidades, redondeos, timezone local, tratamiento N/A por faltantes).
- [ ] A3: Diseñar politicas RLS para separacion estricta entre rol interno y rol cliente (self-access only).
- [ ] A4: Definir contrato funcional/tecnico de reporte parcial (catalogo de warnings y requisitos de visibilidad).
- [ ] A5: Definir estrategia de consistencia para fuente hibrida y reproducibilidad de reportes persistidos.
- [ ] A6: Definir estrategia de ejecucion hibrida (sincrona vs asincrona) y criterios de corte por complejidad/peso.

#### Group B — Feature Logic (runs after Group A, backend+frontend in parallel)
- [ ] B1: Implementar migraciones y schema de persistencia de reportes + indices para listado/filtro (assigned agent: backend).
- [ ] B2: Implementar consultas y acciones para generar, listar y obtener reportes con aislamiento por cliente y control de rol (assigned agent: backend).
- [ ] B3: Integrar pipeline de datos hibrido (repositorio interno + consulta puntual fabricante) con manejo de faltantes N/A y warnings (assigned agent: backend).
- [ ] B4: Implementar motor de exportacion PDF/XLSX para reporte mensual y ad-hoc basico (assigned agent: backend).
- [ ] B5: Construir UI de reportes en dashboard con filtros/busqueda/listado/estados y descarga (assigned agent: frontend).
- [ ] B6: Construir UI de reporte ad-hoc comercial basico para comparativa multi-proyecto del mismo cliente (assigned agent: frontend).

#### Group C — Integration & Polish (runs after Group B)
- [ ] C1: Integrar flujo hibrido de generacion en UI (sincrono para livianos, asincrono para pesados con estado y reintento) (assigned agent: frontend).
- [ ] C2: End-to-end de controles de acceso y no-fuga de datos entre clientes/proyectos (assigned agent: test-qa).
- [ ] C3: Pruebas unitarias/integracion del motor de calculo contractual y politica de faltantes N/A (assigned agent: test-qa).
- [ ] C4: Pruebas de exportacion y consistencia de reportes historicos persistidos (assigned agent: test-qa).

### Review Gate (runs after all groups complete, in parallel)
- [ ] R1: code-reviewer — full diff review
- [ ] R2: security-researcher — auth, RLS, tenant isolation, input validation

### Architecture Sync
- [ ] Update `.cursor/memory/architecture-snapshot.md` (new tables, features, canonical report patterns)
- [ ] Run `/memory sync`

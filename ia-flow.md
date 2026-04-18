# Cómo trabajar con la IA 🤖

> Imagina que la IA es tu ayudante súper inteligente. Pero para que te ayude bien, primero tienes que contarle exactamente qué quieres. Como cuando le pides a alguien que te haga un dibujo: si no le explicas bien, el dibujo no queda como tú querías.

---

## El flujo principal: de idea a código

```
Tu idea → Preguntas → Papel con reglas → ¡Código listo!
```

Son dos conversaciones. **Nunca las mezcles** — cuando termines la primera, cierra y abre una nueva.

---

## Conversación 1 — Descubrir qué quieres

> *Piensa que le estás contando a un amigo qué quieres construir. El amigo te va a hacer preguntas para entenderte bien.*

**Modo**: Agent

**Escribe esto:**
```
/discover-feature <describe tu idea en palabras normales>
```

**¿Qué pasa?**

1. La IA te hace preguntas: ¿quién lo usa?, ¿qué pasa si algo falla?, ¿quién puede ver qué?
2. Tú respondes con calma, sin tecnicismos
3. La IA confirma que entendió bien antes de escribir nada
4. Escribe un archivo con todas las reglas en `.requirements/<nombre>.md`

**Resultado:** un papel con las reglas claras. Como un contrato entre tú y la IA.

> ✋ **Cierra esta conversación antes de continuar.**

### Ejemplo real — Conversación 1

**Tú escribes:**
```
/discover-feature Quiero una pantalla donde los usuarios puedan ver y pagar sus facturas pendientes.
Cada factura tiene número, fecha, monto y estado (pendiente / pagada).
Al pagar, se descuenta del saldo disponible del usuario.
Toda la UI en español.
```

**La IA te pregunta cosas como:**
- ¿Puede un usuario ver las facturas de otro usuario?
- ¿Qué pasa si no tiene saldo suficiente para pagar?
- ¿Las facturas pueden cancelarse o solo pagarse?
- ¿Cuántas facturas puede tener un usuario? ¿Necesitamos paginación?

**Tú respondes:**
```
- No, cada usuario solo ve las suyas
- Si no tiene saldo, mostrar un error en rojo: "Saldo insuficiente"
- Solo se pueden pagar, no cancelar
- Máximo 50 por usuario, sin paginación por ahora
```

**La IA confirma y escribe:**
```
.requirements/facturas.md  ✅
```

---

## Conversación 2 — Construir

> *Ahora le das el papel con las reglas a otro ayudante que sabe programar. Él lee las reglas y construye todo solito.*

**Modo**: Agent — conversación nueva y vacía

**Escribe esto:**
```
/build-feature @.requirements/<nombre>.md
```

**¿Qué pasa paso a paso?**

| Paso | Qué hace la IA |
|------|----------------|
| 1 | Lee las reglas del archivo |
| 2 | Busca en su memoria cómo está hecho el proyecto |
| 3 | Te muestra un plan y espera tu aprobación |
| 4 | Escribe los tests primero (deben fallar) |
| 5 | Escribe el código hasta que los tests pasen |
| 6 | Limpia y ordena |
| 7 | Revisa que no haya errores ni problemas de seguridad |
| 8 | Guarda lo aprendido en la memoria para la próxima vez |

**Resultado:** código completo, probado, revisado. Listo para usar.

### Ejemplo real — Conversación 2

**Tú abres una conversación nueva y escribes:**
```
/build-feature @.requirements/facturas.md
```

**La IA te muestra el plan antes de programar:**
```
Backend:
- Nueva tabla `invoices` (id, user_id, number, date, amount, status)
- RLS: cada usuario solo ve sus facturas
- Server Action `payInvoice`: valida saldo, actualiza status, descuenta saldo
- Zod: valida invoice_id, user autenticado

Frontend:
- InvoiceList: tabla con columnas número, fecha, monto, estado
- PayButton: botón por fila, deshabilitado si ya está pagada
- Toast de éxito o error después de pagar

Tests:
- payInvoice sin autenticación → error
- payInvoice con saldo insuficiente → error con mensaje correcto
- payInvoice exitoso → status cambia a "pagada", saldo decrementado
- InvoiceList renderiza correctamente con datos

¿Apruebas para continuar?
```

**Tú escribes:** `sí` — y la IA construye todo.

---

## Otros casos de uso

### 🐛 Arreglar un bug

```
# Conversación 1: reproducir el error
@test-qa Reproduce este bug: <describe qué está fallando y dónde>

# Conversación 2: arreglarlo
@backend Fix the failing test in <archivo>
# o si es visual:
@frontend Fix the failing test in <archivo>

# Conversación 3: revisar
@code-reviewer Review the changes in src/features/<feature>/
```

> La IA primero escribe un test que demuestra el bug, luego lo arregla. Así sabes que el bug está realmente arreglado y no vuelve.

**Ejemplo:**
```
@test-qa Reproduce este bug: cuando el usuario hace logout y vuelve a entrar,
la lista de todos aparece vacía aunque sí tiene todos en la base de datos.
El problema parece estar en src/features/todos/queries/todos.queries.ts
```

La IA escribe un test que falla → luego `@backend` lo arregla → luego `@code-reviewer` revisa.

---

### 🔧 Refactorizar código

```
# Paso 1: pedir un plan
@technical-lead Plan refactor for <qué quieres mejorar y por qué>

# Paso 2: implementar
@backend Implement the refactor plan
# o:
@frontend Implement the refactor plan

# Paso 3: verificar y revisar
@test-qa Verify all tests still pass
@code-reviewer Review the refactor changes
```

**Ejemplo:**
```
@technical-lead Plan refactor for src/features/auth/actions/
Hay demasiada lógica duplicada entre login.action.ts y logout.action.ts.
Quiero extraer el manejo de errores a una función compartida.
```

---

### 🛣️ Crear solo un endpoint de API

```
/create-api-route
```

La IA te pregunta qué necesita el endpoint y lo crea con validación, manejo de errores y tests.

**Ejemplo:**
```
/create-api-route
```
La IA pregunta: *¿qué ruta?, ¿qué método (GET/POST)?, ¿qué recibe?, ¿qué devuelve?, ¿necesita autenticación?*

Tú respondes y la IA crea `src/app/api/invoices/route.ts` completo.

---

### 🔍 Revisar una rama antes de hacer merge

```
/review-branch
```

Revisa todo el código del branch: errores, malas prácticas, problemas de seguridad. Solo lee, no cambia nada.

**Ejemplo — qué puede reportar:**
```
⚠️  src/features/invoices/actions/pay-invoice.action.ts línea 34:
    No se valida que la factura pertenezca al usuario autenticado antes de pagarla.
    Cualquier usuario podría pagar la factura de otro si conoce el ID.

✅  Tests cubren todos los criterios de aceptación
✅  Sin uso de `any` en TypeScript
✅  Estructura de carpetas sigue la convención features/
```

---

### 🔒 Auditoría de seguridad

```
/security-audit
```

Busca vulnerabilidades en el código: inyecciones, datos sin validar, permisos mal puestos. Solo lee, no cambia nada.

**Ejemplo — qué puede encontrar:**
```
🔴 CRÍTICO: src/app/api/invoices/route.ts
   El parámetro `userId` viene del body sin validar.
   Un atacante puede pasarle el ID de otro usuario.
   Fix: obtener el userId siempre desde la sesión del servidor, nunca del cliente.

🟡 MEDIO: src/features/invoices/components/invoice-list.tsx
   Los montos se muestran sin formatear. Si la DB devuelve null, la app crashea.
   Fix: agregar valor por defecto o validación antes de renderizar.
```

---

### 🧠 Buscar algo en la memoria del proyecto

```
/memory recall "cómo se validan los formularios"
/memory recall "tablas de la base de datos"
/memory recall "cómo se manejan los errores en las actions"
```

La IA busca en su memoria sin tener que leer todos los archivos. Mucho más rápido.

**Ejemplo:**
```
/memory recall "patrón para crear una server action"
```

La IA responde: *"Las server actions usan Zod para validar, devuelven `{ error }` o `{ data }`, y muestran toast con sonner. Ver ejemplo en `src/features/todos/actions/todos.action.ts`."*

---

### 💾 Actualizar la memoria después de cambios grandes

```
/memory sync
```

Guarda el estado actual del proyecto en la memoria para que los agentes lo usen en el futuro.

Úsalo después de: agregar una feature nueva, cambiar la estructura de carpetas, o modificar la base de datos.

---

## Los agentes — quién hace qué

> *Imagina un equipo de personas, cada una experta en algo diferente.*

| Agente | Es como... | Úsalo cuando... |
|--------|-----------|-----------------|
| `@technical-lead` | El jefe de equipo | No sabes por dónde empezar, o quieres un plan antes de hacer algo grande |
| `@frontend` | El diseñador que programa | Quieres cambiar algo visual: botones, formularios, páginas |
| `@backend` | El ingeniero de datos | Quieres cambiar la base de datos, crear una acción del servidor, o manejar permisos |
| `@test-qa` | El probador | Quieres escribir tests, reproducir un bug, o verificar que todo sigue funcionando |
| `@business-analyst` | El que hace las preguntas | Tienes una idea vaga y necesitas convertirla en reglas claras antes de programar |
| `@code-reviewer` | El revisor | Quieres que alguien revise el código antes de hacer merge. No cambia nada, solo opina |
| `@security-researcher` | El guardián | Quieres asegurarte de que no hay huecos de seguridad. No cambia nada, solo revisa |

### Ejemplos de cuándo usar cada agente

```
# Tienes una idea pero no sabes si es viable técnicamente
@technical-lead ¿Es buena idea guardar los archivos PDF de los usuarios en Supabase Storage
en lugar de en la base de datos? ¿Cómo lo haríamos?

# Quieres cambiar cómo se ve un formulario
@frontend El formulario de login se ve muy apretado en móvil.
Quiero más espacio entre campos y el botón más grande.

# Quieres agregar una columna a la base de datos
@backend Necesito agregar la columna `phone` (texto, opcional) a la tabla de usuarios.
Genera la migración y actualiza el schema.

# Quieres saber si tus tests cubren todos los casos
@test-qa Revisa los tests de src/features/invoices/ y dime qué casos faltan.

# Tienes una idea vaga antes de empezar
@business-analyst Quiero que los usuarios puedan invitar a otras personas a su equipo.
Ayúdame a definir bien los requisitos antes de programar.

# Terminaste una feature y quieres una segunda opinión
@code-reviewer Revisa los cambios en src/features/invoices/

# Vas a lanzar a producción y quieres estar seguro
@security-researcher Haz una auditoría de src/features/auth/ antes del lanzamiento.
```

---

## Regla de oro

> **Primero las reglas, después el código.**
>
> Si le pides a la IA que programe sin darle las reglas primero, va a adivinar. Y cuando adivina, se equivoca. El archivo `.requirements/<nombre>.md` es el contrato. Sin contrato, no hay código.

---

## Referencia rápida

| Quiero... | Modo | Comando |
|-----------|------|---------|
| Definir qué construir | Agent | `/discover-feature <descripción>` |
| Construir una feature | Agent (nueva conversación) | `/build-feature @.requirements/<nombre>.md` |
| Arreglar un bug | Agent | `@test-qa Reproduce: <descripción>` |
| Planear un refactor | Agent | `@technical-lead Plan: <descripción>` |
| Crear un endpoint | Agent | `/create-api-route` |
| Revisar una rama | Agent | `/review-branch` |
| Auditar seguridad | Agent | `/security-audit` |
| Buscar en la memoria | Cualquiera | `/memory recall "<consulta>"` |
| Sincronizar memoria | Agent | `/memory sync` |

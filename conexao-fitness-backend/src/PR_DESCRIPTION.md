# feat(bookings): módulo de bookings completo — service, controller, DTOs e testes

## Contexto

Fecha o módulo de bookings de ponta a ponta. O código existente tinha a estrutura base (entidade, module, service parcial, controller parcial), mas faltavam:
- Campo `cancelledAt` na entidade
- `User` no `TypeOrmModule.forFeature` do BookingsModule
- Registro de `BookingsModule` e da entidade `Booking` no `AppModule`
- Métodos `cancelBooking`, `listServiceBookings` com filtro de status
- DTOs `CancelBookingDto` e `FilterBookingsDto`
- Uso correto do enum `ScheduleSlotStatus` (evita comparação com string solta)
- Testes unitários

---

## Arquivos alterados

| Arquivo | Tipo |
|---|---|
| `src/modules/bookings/entities/booking.entity.ts` | modificado (+ `cancelledAt`) |
| `src/modules/bookings/bookings.module.ts` | modificado (+ `User` no forFeature) |
| `src/modules/bookings/bookings.service.ts` | substituído (implementação completa) |
| `src/modules/bookings/bookings.controller.ts` | substituído (4 rotas) |
| `src/modules/bookings/dto/create-booking.dto.ts` | sem alteração |
| `src/modules/bookings/dto/cancel-booking.dto.ts` | **novo** |
| `src/modules/bookings/dto/filter-bookings.dto.ts` | **novo** |
| `src/modules/bookings/bookings.service.spec.ts` | **novo** (16 casos de teste) |
| `src/app.module.ts` | modificado (+ BookingsModule + Booking entity) |

---

## Decisões de modelagem

### Relação Booking ↔ ScheduleSlot ↔ User

```
User (1) ──────────── (N) Booking (N) ──────────── (1) ScheduleSlot
                                 (N) ──────────── (1) Service
```

- `Booking.studentId` → FK para `User.id` (via `@ManyToOne`)
- `Booking.slotId` → FK para `ScheduleSlot.id` (via `@ManyToOne`)
- `Booking.serviceId` → FK para `Service.id` (via `@ManyToOne`)
- `ScheduleSlot.bookings` → `@OneToMany` para histórico (não sobrescreve)

**Por que manter histórico em vez de sobrescrever?**  
O `ScheduleSlot` armazena apenas o estado atual (`status: AVAILABLE | BOOKED | BLOCKED`).  
Cada `Booking` é um registro imutável com `status` próprio (`CONFIRMED | CANCELLED | PENDING`).  
Isso permite auditoria completa e suporte futuro a waitlist.

### Garantia de consistência: lock pessimista + double-check

O `createBooking` executa dentro de uma transação TypeORM com `lock: { mode: 'pessimistic_write' }` no slot. Isso serializa escritas concorrentes no mesmo slot a nível de banco de dados (`SELECT ... FOR UPDATE`). O double-check via `QueryBuilder` antes de criar o booking é uma camada de segurança adicional para o caso de reuse do slot após cancelamento.

### Cancelamento e devolução do slot

Ao cancelar, `BookingsService.cancelBooking` verifica se há outro booking `CONFIRMED|PENDING` para o mesmo slot antes de devolvê-lo para `AVAILABLE`. Isso prepara o terreno para uma futura feature de **waitlist** sem alterar a lógica atual.

### Prevenção de N+1

Todos os métodos de listagem usam `createQueryBuilder` com `leftJoinAndSelect` para carregar relações em uma única query SQL, seguindo a recomendação do TypeORM para evitar queries implícitas por lazy loading.

---

## Rotas REST

| Método | Path | Descrição |
|---|---|---|
| `POST` | `/bookings` | Cria uma reserva |
| `PATCH` | `/bookings/:bookingId/cancel` | Cancela uma reserva |
| `GET` | `/bookings/students/:studentId` | Lista bookings do aluno (`?status=`) |
| `GET` | `/bookings/services/:serviceId` | Lista bookings do service (`?status=`) |

---

## Como testar

```bash
# Unitários
npm run test -- bookings.service.spec.ts

# Todos os testes
npm run test
```

### Exemplos HTTP

```http
### Criar booking
POST http://localhost:3000/bookings
Content-Type: application/json

{
  "serviceId": "<uuid>",
  "slotId": "<uuid>",
  "studentId": "<uuid>"
}

### Cancelar booking
PATCH http://localhost:3000/bookings/<bookingId>/cancel
Content-Type: application/json

{
  "studentId": "<uuid>"
}

### Listar bookings do aluno (só confirmados)
GET http://localhost:3000/bookings/students/<studentId>?status=CONFIRMED

### Listar bookings do service (todos)
GET http://localhost:3000/bookings/services/<serviceId>
```

---

## Próximos passos sugeridos

- [ ] Adicionar `AuthGuard` / `@CurrentUser()` para remover `studentId` do body no cancel
- [ ] Migração explícita para adicionar coluna `cancelled_at` na tabela `bookings`
- [ ] Testes e2e com banco in-memory (SQLite) ou test containers
- [ ] Evento `BookingCancelledEvent` para integração com notificações

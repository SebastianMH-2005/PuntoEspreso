-- Pagos con QR (Yape / Plin): número de operación que informa el cliente, para que el personal verifique el pago.
-- Es único: un mismo pago no puede usarse en dos pedidos. (Los pagos con tarjeta lo dejan vacío.)
alter table ordenes add column codigo_operacion varchar(20);
create unique index uq_ordenes_codigo_operacion on ordenes (codigo_operacion);
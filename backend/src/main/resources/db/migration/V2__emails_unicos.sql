-- El email identifica a cada cuenta y no puede repetirse. (El DNI ya tenía su índice único en V1.)
-- Para deshacerlo a mano: drop index uq_clientes_email; drop index uq_usuarios_sistema_email;
create unique index uq_clientes_email on clientes (email);
create unique index uq_usuarios_sistema_email on usuarios_sistema (email);
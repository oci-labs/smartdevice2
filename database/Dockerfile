FROM mysql/mysql-server:5.7

ENV MYSQL_ALLOW_EMPTY_PASSWORD 1

# All .sql files copied to the
# /docker-entrypoint-initdb.d directory are executed
# when the container starts for the first time.
COPY ddl.sql /docker-entrypoint-initdb.d

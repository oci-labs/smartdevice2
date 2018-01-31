FROM mysql:5.7

# All .sql files copied to the
# /docker-entrypoint-initdb.d directory are executed
# when the container starts for the first time.
COPY ddl.sql /docker-entrypoint-initdb.d

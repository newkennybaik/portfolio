package com.example.vidyoupdater;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;

@Component
public class SchemaInitializer {

    private static final Logger log = LoggerFactory.getLogger(SchemaInitializer.class);

    private final DataSource dataSource;

    public SchemaInitializer(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @PostConstruct
    public void init() {
        try (Connection conn = dataSource.getConnection()) {
            // 테이블이 하나도 없으면 schema.sql 실행
            var rs = conn.getMetaData().getTables(null, null, null, null);
            if (rs.next()) {
                log.info("Existing tables found. schema.sql will NOT be executed.");
                return;
            }

            log.info("No tables found. Executing schema.sql ...");
            ScriptUtils.executeSqlScript(conn, new ClassPathResource("schema.sql"));
            log.info("schema.sql execution finished.");

        } catch (Exception e) {
            log.error("Failed to initialize schema", e);
            throw new RuntimeException(e);
        }
    }
}

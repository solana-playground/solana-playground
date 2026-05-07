use std::sync::OnceLock;

use anyhow::{anyhow, Result};
use serde_json::Value;
use sqlx::{postgres::PgPoolOptions, PgPool};
use uuid::Uuid;

/// Global database connection pool
static DB: OnceLock<PgPool> = OnceLock::new();

/// Initialize the global database connection pool.
///
/// NOTE: Other functions in this module will not be usable before this function is executed.
/// `_namespace` is db-agnostic naming so this signature survives a DB provider swap.
pub async fn init(uri: &str, _namespace: String, max_connections: u32) -> Result<()> {
    // `max_connections` defaults to sqlx's default (10); tune via `PG_DB_MAX_CONNECTIONS`
    let pool = PgPoolOptions::new()
        .max_connections(max_connections)
        .connect(uri)
        .await?;

    // No-arg form defaults to `./migrations` (CARGO_MANIFEST_DIR-relative).
    sqlx::migrate!().run(&pool).await?;

    DB.set(pool).map_err(|_| anyhow!("Failed to init `DB`"))
}

/// Find the value by id in the given `collection` (table).
pub async fn find_by_id(id: &str, collection: &str) -> Result<Option<Value>> {
    let pool = get_pool()?;
    let id = Uuid::parse_str(id)?;

    let query = format!("SELECT data FROM {collection} WHERE id = $1");
    let row: Option<(Value,)> = sqlx::query_as(&query).bind(id).fetch_optional(pool).await?;

    Ok(row.map(|(data,)| data))
}

/// Insert the value inside the given `collection` (table).
pub async fn insert(value: Value, collection: &str) -> Result<String> {
    let pool = get_pool()?;
    let id = Uuid::new_v4();

    let query = format!("INSERT INTO {collection} (id, data) VALUES ($1, $2) RETURNING id");
    let row: (Uuid,) = sqlx::query_as(&query)
        .bind(id)
        .bind(&value)
        .fetch_one(pool)
        .await?;

    Ok(row.0.to_string())
}

/// Get the database connection pool.
///
/// # Errors
///
/// This function returns an error if [`DB`] isn't initialized.
fn get_pool() -> Result<&'static PgPool> {
    DB.get()
        .ok_or_else(|| anyhow!("`db::init` must be called before `get_pool`"))
}

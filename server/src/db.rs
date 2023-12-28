use std::{sync::OnceLock, time::Duration};

use anyhow::{anyhow, Result};
use mongodb::{
    bson::{doc, oid::ObjectId, Bson},
    options::ClientOptions,
    Client, Collection,
};
use serde_json::Value;

/// Global database client
static DB: OnceLock<Client> = OnceLock::new();

/// Initialize the global database singleton.
///
/// NOTE: Other functions in this module will not be usable before this function is executed.
pub async fn init(uri: &str, name: String) -> Result<()> {
    let mut options = ClientOptions::parse(uri).await?;
    options.default_database = Some(name);
    options.server_selection_timeout = Some(Duration::from_secs(2));

    let client = Client::with_options(options)?;
    DB.set(client).map_err(|_| anyhow!("Failed to init `DB`"))
}

/// Find the value by id in the given `collection`.
pub async fn find_by_id(id: &str, collection: &str) -> Result<Option<Value>> {
    let id = ObjectId::parse_str(id)?;
    let value = get_collection(collection)
        .find_one(doc! { "_id": id }, None)
        .await?;
    Ok(value)
}

/// Insert the value inside the given `collection`.
pub async fn insert(value: Value, collection: &str) -> Result<String> {
    match get_collection(collection)
        .insert_one(value, None)
        .await?
        .inserted_id
    {
        Bson::ObjectId(id) => Ok(id.to_string()),
        _ => Err(anyhow!("Unexpected `insert_one` result")),
    }
}

/// Get collection from the given collection `name`.
///
/// # Panics
///
/// This function panics in the following scenerios:
/// - [`DB`] isn't initialized
/// - Default database isn't set
fn get_collection(name: &str) -> Collection<Value> {
    DB.get()
        .expect("`db::init` must be called before `get_collection`")
        .default_database()
        .expect("Default database must be set")
        .collection(name)
}

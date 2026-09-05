mod config;
mod middlewares;
mod routes;
#[cfg(feature = "unstable")]
mod setup;

use std::net::{Ipv4Addr, SocketAddr};

use anyhow::Result;
use axum::{
    middleware,
    routing::{get, post},
    Router,
};
use solpg_server::{
    db,
    log::{self, info},
};
use tokio::net::TcpListener;

use self::{config::Config, middlewares::*, routes::*};

#[tokio::main]
async fn main() -> Result<()> {
    let config = Config::from_env();
    log::init(config.verbose);
    info!("Config loaded: {config:#?}");

    #[cfg(feature = "unstable")]
    setup::setup().await?;

    db::init(&config.db_uri, config.db_name).await?;
    info!("DB initialized");

    let stable_routes = Router::new()
        .route(
            "/build",
            post(build).with_state(BuildState::new(config.build_concurrency)),
        )
        .route("/deploy/{uuid}", get(deploy))
        .route("/share/{id}", get(share_get))
        .route("/new", post(share_new));

    let unstable_routes = if cfg!(feature = "unstable") {
        Router::new()
            .route(
                "/build",
                post(unstable::build).layer(concurrency_limit(config.build_concurrency)),
            )
            .route("/deploy/{uuid}", get(unstable::deploy))
            .route(
                "/bundle",
                post(unstable::bundle)
                    .with_state(unstable::BundleState::default())
                    .layer(concurrency_limit(config.bundle_concurrency)),
            )
    } else {
        Router::new()
    };

    let app = Router::new()
        .merge(stable_routes)
        .nest("/unstable", unstable_routes)
        .layer(compression())
        .layer(payload_limit(config.payload_limit))
        .layer(cors(config.client_urls))
        .layer(middleware::from_fn(log));

    let addr = SocketAddr::from((Ipv4Addr::UNSPECIFIED, config.port));
    let listener = TcpListener::bind(addr).await?;
    info!("Listening on {addr}");

    axum::serve(listener, app).await?;

    Ok(())
}

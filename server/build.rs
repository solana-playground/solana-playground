fn main() {
    // Tell cargo to rerun if migrations change
    println!("cargo:rerun-if-changed=migrations");
}
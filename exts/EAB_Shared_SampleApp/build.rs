use std::env;
use std::fs;
use std::path::PathBuf;

fn main() {
    let manifest_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    let templates_dir = PathBuf::from(&manifest_dir).join("templates");
    let out_rs = PathBuf::from(&manifest_dir)
        .join("src")
        .join("templates_embedded.rs");

    let mut entries: Vec<(String, Vec<u8>)> = Vec::new();
    collect(&templates_dir, &templates_dir, &mut entries);
    entries.sort_by(|a, b| a.0.cmp(&b.0));

    let mut out = String::new();
    out.push_str("pub static TEMPLATE_FILES: &[(&str, &[u8])] = &[\n");
    for (rel, bytes) in &entries {
        out.push_str(&format!("    ({:?}, &[{}]),\n", rel, bytes_to_literal(bytes)));
    }
    out.push_str("];\n");
    fs::write(&out_rs, out).expect("write templates_embedded.rs");
    println!("cargo:rerun-if-changed={}", templates_dir.display());
}

fn collect(dir: &PathBuf, root: &PathBuf, out: &mut Vec<(String, Vec<u8>)>) {
    let rd = match fs::read_dir(dir) {
        Ok(r) => r,
        Err(_) => return,
    };
    for entry in rd.flatten() {
        let p = entry.path();
        if p.is_dir() {
            collect(&p, root, out);
        } else {
            let rel = p
                .strip_prefix(root)
                .unwrap()
                .to_string_lossy()
                .replace('\\', "/");
            let bytes = fs::read(&p).expect("read template file");
            out.push((rel, bytes));
        }
    }
}

fn bytes_to_literal(bytes: &[u8]) -> String {
    let mut s = String::new();
    for (i, b) in bytes.iter().enumerate() {
        if i > 0 {
            s.push(',');
        }
        s.push_str(&b.to_string());
    }
    s
}

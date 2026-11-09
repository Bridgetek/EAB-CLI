//! Shared EVE HAL sample-application generator.
//!
//! Mirrors `generator.py` from the reference EAB tools: renders the embedded
//! `templates/` tree into `<output>/<projectName>` for a given example type.

pub mod jinja;

use serde_json::{json, Value};
use std::path::Path;

include!("templates_embedded.rs");

fn find_template(rel: &str) -> Option<&'static [u8]> {
    TEMPLATE_FILES.iter().find(|(r, _)| *r == rel).map(|(_, b)| *b)
}

fn write_out(path: &Path, bytes: &[u8]) {
    if let Some(parent) = path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    let _ = std::fs::write(path, bytes);
}

fn write_text(path: &Path, text: &str) {
    write_out(path, text.as_bytes());
}

fn render_template(rel: &str, ctx: &jinja::Context) -> String {
    let bytes = find_template(rel).unwrap_or_else(|| panic!("template not found: {rel}"));
    let text = String::from_utf8_lossy(bytes).to_string();
    jinja::render(&text, ctx)
}

/// Render a template that is not part of the embedded tree (e.g. a caller's
/// own `eve_common` copy) using the same Jinja subset.
pub fn render_str(template: &str, ctx: &jinja::Context) -> String {
    jinja::render(template, ctx)
}

/// `generator.py::generateEveHalFiles` + `generatePlatformFiles` +
/// `copy_common_libs` + `renderVscodeFiles`.
fn generate_hal(sa_dir: &Path, platform: &str, project_name: &str, converted_path: &str) {
    let mut ctx = jinja::Context::new();
    ctx.set_fn("ChipSupport", jinja::chip_support_fn);

    let hal_files = [
        ("eve_hal_templates/EVE_HAL/include/EVE.h.j2", "Libs/EVE_HAL/include/EVE.h"),
        ("eve_hal_templates/EVE_HAL/include/HAL.h.j2", "Libs/EVE_HAL/include/HAL.h"),
        ("eve_hal_templates/EVE_HAL/include/MCU.h.j2", "Libs/EVE_HAL/include/MCU.h"),
        (
            "eve_hal_templates/EVE_HAL/include/EVE_config.h.j2",
            "Libs/EVE_HAL/include/EVE_config.h",
        ),
        ("eve_hal_templates/EVE_HAL/include/BT82x.h.j2", "Libs/EVE_HAL/include/BT82x.h"),
        ("eve_hal_templates/EVE_HAL/include/FT8xx.h.j2", "Libs/EVE_HAL/include/FT8xx.h"),
        ("eve_hal_templates/EVE_HAL/source/EVE_API.c.j2", "Libs/EVE_HAL/src/EVE_API.c"),
        ("eve_hal_templates/EVE_HAL/source/EVE_HAL.c.j2", "Libs/EVE_HAL/src/EVE_HAL.c"),
    ];
    for (tpl, out) in hal_files {
        let rendered = render_template(tpl, &ctx);
        write_text(&sa_dir.join(out), &rendered);
    }

    let (port_src, port_out, lib_prefix, lib_dir) = if platform == "FT4222" {
        (
            "eve_hal_templates/EVE_HAL/ports/eve_libft4222/EVE_libft4222.c",
            "Libs/EVE_HAL/ports/eve_libft4222/EVE_libft4222.c",
            "eve_hal_templates/ft4222/",
            "ft4222",
        )
    } else {
        (
            "eve_hal_templates/EVE_HAL/ports/eve_libmpsse/EVE_libmpsse.c",
            "Libs/EVE_HAL/ports/eve_libmpsse/EVE_libmpsse.c",
            "eve_hal_templates/mpsse/",
            "mpsse",
        )
    };
    if let Some(b) = find_template(port_src) {
        write_out(&sa_dir.join(port_out), b);
    }
    for (rel, bytes) in TEMPLATE_FILES {
        if let Some(stripped) = rel.strip_prefix(lib_prefix) {
            write_out(&sa_dir.join(format!("Libs/{lib_dir}/{stripped}")), bytes);
        }
    }

    let mut vctx = jinja::Context::new();
    vctx.set(
        "fileCfg",
        json!({
            "projectName": project_name,
            "platformName": platform,
            "generatedFilePath": converted_path.replace('\\', "/"),
            "isPalletedARGB8": false,
        }),
    );
    for (tpl, out) in [
        ("vscode/launch.json.j2", ".vscode/launch.json"),
        ("vscode/tasks.json.j2", ".vscode/tasks.json"),
        ("vscode/c_cpp_properties.json.j2", ".vscode/c_cpp_properties.json"),
    ] {
        let rendered = render_template(tpl, &vctx);
        write_text(&sa_dir.join(out), &rendered);
    }
}

/// `generator.py::renderExample_c_h_files`.
fn generate_example_files(sa_dir: &Path, example_type: &str) {
    let mut ctx = jinja::Context::new();
    ctx.set("exampleType", Value::String(example_type.to_string()));
    for (tpl, out) in [
        ("common/App.c.j2", "Src/App.c"),
        ("Includes/eve_example.h.j2", "Src/eve_example.h"),
    ] {
        let rendered = render_template(tpl, &ctx);
        write_text(&sa_dir.join(out), &rendered);
    }
}

/// `generator.py::generateEveCommonFiles` for the non-flash example types.
fn generate_common(sa_dir: &Path, example_type: &str, file_cfg: &Value) {
    let (tpl, out) = match example_type {
        "image" => ("eve_common/eve_images.c.j2", "Src/eve_images.c"),
        "image_flash" => ("eve_common/eve_images_flash.c.j2", "Src/eve_images_flash.c"),
        "font" => ("eve_common/eve_fonts.c.j2", "Src/eve_fonts.c"),
        "video" => ("eve_common/eve_videos.c.j2", "Src/eve_videos.c"),
        "audio" => ("eve_common/eve_audio.c.j2", "Src/eve_audio.c"),
        "animation" => ("eve_common/eve_animation.c.j2", "Src/eve_animation.c"),
        _ => return,
    };
    let mut ctx = jinja::Context::new();
    ctx.set_fn("ChipSupport", jinja::chip_support_fn);
    ctx.set("fileCfg", file_cfg.clone());
    let rendered = render_template(tpl, &ctx);
    write_text(&sa_dir.join(out), &rendered);
}

/// Generate `<output_dir>/<folder_name>` exactly like `generator_run`.
///
/// `project_name` is the CMake/VS project name (usually the asset stem), which
/// may differ from the folder name. `file_cfg` is the `fileCfg` object handed to
/// the `eve_common` template. Returns the generated project folder path.
pub fn generate(
    output_dir: &str,
    folder_name: &str,
    project_name: &str,
    platform: &str,
    example_type: &str,
    file_cfg: &Value,
    converted_path: &str,
) -> String {
    let sa_dir = Path::new(output_dir).join(folder_name);
    let _ = std::fs::create_dir_all(&sa_dir);

    let mut ctx = jinja::Context::new();
    ctx.set(
        "config",
        json!({ "platform": platform, "projectName": project_name }),
    );
    let cmake = render_template("cmake_template.j2", &ctx);
    write_text(&sa_dir.join("CMakeLists.txt"), &cmake);

    generate_hal(&sa_dir, platform, project_name, converted_path);
    generate_example_files(&sa_dir, example_type);
    generate_common(&sa_dir, example_type, file_cfg);

    println!(
        "Project template generated at: {}.\n\
         Look at the README.md for more information regarding to building the project.",
        sa_dir.display()
    );
    println!("EVE HAL project template generation completed.");
    sa_dir.to_string_lossy().to_string()
}

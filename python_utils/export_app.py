from pathlib import Path
from typing import List, Set
from dataclasses import dataclass

@dataclass
class ProjectExporter:
    root_dir: Path
    include_dirs: Set[str]
    output_dir: Path
    output_name: str
    
    def __init__(self, root_dir: str, include_dirs: List[str] = None,
                 output_dir: str = "/home/ubuntu", output_name: str = "project_export.md"):
        self.root_dir = Path(root_dir)
        self.include_dirs = set(include_dirs or [])
        self.output_dir = Path(output_dir)
        self.output_name = output_name
        
    def get_included_paths(self):
        paths = []
        for dir_name in self.include_dirs:
            target_dir = self.root_dir / dir_name
            if target_dir.exists():
                for p in target_dir.rglob("*"):
                    # Exclude node_modules directory and its contents
                    if 'node_modules' in p.parts:
                        continue
                    # Exclude package.json and package-lock.json files
                    if p.name in ("package.json", "package-lock.json"):
                        continue
                    paths.append(p)
        return sorted(paths)
    
    def get_file_contents(self):
        return [(p, p.read_text(errors='ignore'))
                for p in self.get_included_paths()
                if p.is_file()]
    
    def export(self):
        files = self.get_file_contents()
        
        output = []
        
        for file_path, content in files:
            rel_path = file_path.relative_to(self.root_dir)
            ext = file_path.suffix.lstrip('.')
            
            output.extend([
                f"### {self.root_dir.name}/{rel_path}\n",
                f"```{ext}",
                content,
                "```\n"
            ])
            
        output_path = self.output_dir / self.output_name
        output_path.write_text("\n".join(output))
        print(f"Export completed: {output_path}")

# Usage
if __name__ == "__main__":
    exporter = ProjectExporter(
        root_dir="/home/ubuntu/visualneurons-web-gen2",
        include_dirs=["amplify", "pages", "styles", "components"],
        output_dir="/home/ubuntu",
        output_name="app.md"
    )
    exporter.export()

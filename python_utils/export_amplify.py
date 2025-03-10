from pathlib import Path
from typing import List, Set
from dataclasses import dataclass
import re

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

    def filter_nextjs_content(self, content: str) -> str:
        lines = content.split('\n')
        filtered_lines = []
        include_block = True
        filter_active = False
        
        for line in lines:
            if '<InlineFilter filters=' in line:
                filter_active = True
                include_block = 'nextjs' in line
                continue
                
            if filter_active and '</InlineFilter>' in line:
                filter_active = False
                continue
                
            if not filter_active or include_block:
                filtered_lines.append(line)
                
        return '\n'.join(filtered_lines)
        
    def get_included_paths(self):
        paths = []
        for dir_name in self.include_dirs:
            target_dir = self.root_dir / dir_name
            if target_dir.exists():
                paths.extend(target_dir.rglob("*"))
        return sorted(paths)
    
    def get_file_contents(self):
        return [(p, self.filter_nextjs_content(p.read_text(errors='ignore'))) 
                for p in self.get_included_paths() 
                if p.is_file()]
    
    def export(self):
        files = self.get_file_contents()
        output = []
        
        for file_path, content in files:
            if not content.strip(): continue
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
        root_dir="/home/ubuntu/docs",
        include_dirs=[#"src/pages/[platform]/build-a-backend/storage", 
                      #"src/pages/[platform]/build-a-backend/functions",
                      "src/pages/[platform]/build-a-backend/data",
                      #"src/pages/[platform]/build-a-backend/data",
                      #"src/pages/[platform]/build-a-backend/add-aws-services/logging",
                      #"src/pages/[platform]/build-a-backend/add-aws-services/analytics",
                      #"src/pages/[platform]/build-a-backend/auth"
                      ],
        output_name="amplify_docs.md"
    )
    exporter.export()
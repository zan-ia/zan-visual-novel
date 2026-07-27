"""
Extract markdown from PDF using markitdown.
Usage: python scripts/extract-pdf-markdown.py <input.pdf> [output.md]
"""

import sys
import os
from pathlib import Path

try:
    from markitdown import MarkItDown
except ImportError:
    print("Error: markitdown is not installed. Run:")
    print("  pip install --break-system-packages markitdown[pdf]")
    sys.exit(1)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    input_path = Path(sys.argv[1])
    if not input_path.exists():
        print(f"Error: File not found: {input_path}")
        sys.exit(1)

    # Default output: same name with .md extension
    if len(sys.argv) >= 3:
        output_path = Path(sys.argv[2])
    else:
        output_path = input_path.with_suffix(".md")

    print(f"Converting: {input_path}")
    print(f"Output:     {output_path}")

    try:
        md = MarkItDown()
        result = md.convert(str(input_path))
        
        output_path.write_text(result.text_content, encoding="utf-8")
        
        # Print stats
        lines = result.text_content.count("\n") + 1
        chars = len(result.text_content)
        size_kb = os.path.getsize(output_path) / 1024
        print(f"\nDone! {lines} lines, {chars:,} chars, {size_kb:.1f} KB saved to {output_path}")
        
    except Exception as e:
        print(f"Error during conversion: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

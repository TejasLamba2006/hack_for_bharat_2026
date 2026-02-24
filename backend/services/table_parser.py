"""
Enhanced Table-Aware Document Parser
Extracts tables from PDFs and documents while preserving structure
"""

import io
from typing import Any, Callable
import pathway as pw
from pathway.xpacks.llm.parsers import UnstructuredParser
import pdfplumber
import pandas as pd
from tabulate import tabulate


class TableAwareParser(UnstructuredParser):
    """
    Custom parser that extracts tables from documents and formats them as markdown.
    Extends Pathway's UnstructuredParser with enhanced table extraction.
    """
    
    def __init__(
        self,
        chunking_mode: str = "elements",
        partition_kwargs: dict | None = None,
        post_processors: list[Callable] | None = None,
        chunking_kwargs: dict | None = None,
        cache_strategy: Any = None
    ):
        """
        Initialize the table-aware parser.
        
        Args:
            chunking_mode: Mode used to chunk the document ('single', 'elements', 'paged', 'basic', 'by_title')
            partition_kwargs: Extra kwargs to be passed to unstructured.io's partition function
            post_processors: List of callables that will be applied to all extracted texts
            chunking_kwargs: Extra kwargs to be passed to unstructured.io's chunk_elements or chunk_by_title function
            cache_strategy: Cache strategy for the parser
        """
        # Configure partition_kwargs for better table extraction
        if partition_kwargs is None:
            partition_kwargs = {}
        
        # Set high-resolution strategy for better table detection
        if "strategy" not in partition_kwargs:
            partition_kwargs["strategy"] = "hi_res"
        
        # Enable table structure inference
        if "infer_table_structure" not in partition_kwargs:
            partition_kwargs["infer_table_structure"] = True
        
        super().__init__(
            chunking_mode=chunking_mode,
            partition_kwargs=partition_kwargs,
            post_processors=post_processors,
            chunking_kwargs=chunking_kwargs or {},
            cache_strategy=cache_strategy
        )
        
    @staticmethod
    def extract_tables_with_pdfplumber(file_bytes: bytes) -> list[dict]:
        """
        Extract tables using pdfplumber for enhanced table detection.
        
        Args:
            file_bytes: PDF file content as bytes
            
        Returns:
            List of dictionaries containing table data and metadata
        """
        tables_data = []
        
        try:
            pdf_file = io.BytesIO(file_bytes)
            with pdfplumber.open(pdf_file) as pdf:
                for page_num, page in enumerate(pdf.pages, start=1):
                    # Extract tables from the page
                    tables = page.extract_tables()
                    
                    for table_idx, table in enumerate(tables):
                        if table and len(table) > 0:
                            # Convert table to pandas DataFrame for easier manipulation
                            try:
                                # Use first row as headers if it looks like headers
                                df = pd.DataFrame(table[1:], columns=table[0])
                                
                                # Clean up the dataframe
                                df = df.fillna("")  # Replace NaN with empty strings
                                
                                # Convert to markdown table format
                                markdown_table = tabulate(
                                    df,
                                    headers='keys',
                                    tablefmt='pipe',  # GitHub-flavored markdown
                                    showindex=False
                                )
                                
                                tables_data.append({
                                    "page": page_num,
                                    "table_index": table_idx,
                                    "markdown": markdown_table,
                                    "row_count": len(df),
                                    "col_count": len(df.columns),
                                    "type": "table"
                                })
                            except Exception as e:
                                # If DataFrame creation fails, store as raw table
                                markdown_table = tabulate(table, tablefmt='pipe')
                                tables_data.append({
                                    "page": page_num,
                                    "table_index": table_idx,
                                    "markdown": markdown_table,
                                    "type": "table",
                                    "error": str(e)
                                })
        except Exception as e:
            print(f"Error extracting tables with pdfplumber: {e}")
        
        return tables_data
    
    def __call__(self, contents: bytes, **kwargs) -> list[tuple[str, dict]]:
        """
        Parse document with enhanced table extraction.
        
        Args:
            contents: Document content as bytes
            **kwargs: Additional arguments (e.g., metadata, chunking_mode, partition_kwargs)
            
        Returns:
            List of tuples (text, metadata) for each parsed chunk
        """
        # Get the original parsed results from UnstructuredParser
        parsed_results = super().__call__(contents, **kwargs)
        
        # Try to extract tables with pdfplumber for PDFs
        metadata = kwargs.get("metadata", {})
        file_path = metadata.get("path", "")
        
        if file_path.lower().endswith(".pdf"):
            try:
                tables = self.extract_tables_with_pdfplumber(contents)
                
                # Add tables to parsed results with special metadata
                for table_data in tables:
                    table_text = (
                        f"\n\n## Table on Page {table_data['page']}\n\n"
                        f"{table_data['markdown']}\n\n"
                        f"*Table with {table_data.get('row_count', '?')} rows "
                        f"and {table_data.get('col_count', '?')} columns*\n\n"
                    )
                    
                    table_metadata = {
                        **metadata,
                        "type": "table",
                        "page": table_data["page"],
                        "table_index": table_data["table_index"],
                        "is_table": True,
                        "row_count": table_data.get("row_count"),
                        "col_count": table_data.get("col_count")
                    }
                    
                    parsed_results.append((table_text, table_metadata))
                    
                if tables:
                    print(f"✅ Extracted {len(tables)} tables from {file_path}")
                
            except Exception as e:
                print(f"⚠️  Table extraction fallback failed: {e}")
        
        return parsed_results


def create_table_aware_parser(**kwargs) -> TableAwareParser:
    """
    Factory function to create a table-aware parser.
    
    Args:
        **kwargs: Additional configuration for the parser (chunking_mode, partition_kwargs, etc.)
        
    Returns:
        Configured TableAwareParser instance
    """
    # Set default chunking_mode if not provided
    if "chunking_mode" not in kwargs:
        kwargs["chunking_mode"] = "elements"  # Parse document into elements for better structure
    
    return TableAwareParser(**kwargs)

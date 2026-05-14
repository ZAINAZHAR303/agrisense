from dotenv import load_dotenv

import os
load_dotenv()

print("Testing environment variable loading:")
print("GEMINI_API_KEY:", os.getenv("GEMINI_API_KEY"))
print("OPENAI_API_KEY:", os.getenv("OPENAI_API_KEY"))

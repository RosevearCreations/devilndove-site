"""Release 465 inline-image budget parser — actual data URI bytes only.

Unlike splitting the source on every `data:` token, this does not mistake
ordinary object properties / API payload text for embedded binary assets.
"""
import re

DATA_URI = re.compile(
    r'''data:(?:[a-z][a-z0-9.+-]*/[a-z0-9.+-]+)?(?:;[a-z0-9.+-]+(?:=[a-z0-9.+-]+)?)*,[^\s'"<>`()\\]*''',
    re.IGNORECASE,
)


def inline_data_uri_bytes(text: str) -> int:
    return sum(len(match.group(0).encode('utf-8')) for match in DATA_URI.finditer(text))

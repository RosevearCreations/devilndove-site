"""Keep the existing image-byte threshold strict without false positives."""
from inline_data_uri_budget import inline_data_uri_bytes


def main():
    js = "const payload = { data: { text: 'not an image' }, other: 3 };"
    assert inline_data_uri_bytes(js) == 0
    actual = 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4='
    assert inline_data_uri_bytes(f'<img src="{actual}">') == len(actual)
    css = 'data:image/png;base64,aGVsbG8='
    assert inline_data_uri_bytes(f'url({css})') == len(css)
    plain = 'data:text/plain;charset=utf-8,hello%20world'
    assert inline_data_uri_bytes(f"const x='{plain}'") == len(plain)
    assert inline_data_uri_bytes(js + actual + ' ' + css) == len(actual) + len(css)
    print('BUILD 443 INLINE DATA URI BUDGET REGRESSION=GREEN')


if __name__ == '__main__':
    main()

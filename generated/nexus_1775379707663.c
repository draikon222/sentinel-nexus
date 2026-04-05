#include <stddef.h>

void xor_cipher(char* data, size_t len, const char* key, size_t key_len) {
    if (data == NULL || key == NULL) {
        return;
    }

    const char* key_end = key + key_len;
    const char* key_ptr = key;

    for (size_t i = 0; i < len; i++) {
        data[i] = data[i] ^ *key_ptr;
        key_ptr = (key_ptr == key_end) ? key : key_ptr + 1;
    }
}

#include <stddef.h>

void xor_cipher(char* data, size_t len, const char* key, size_t key_len) {
    if (data == NULL || key == NULL) {
        return;
    }

    if (key_len == 0) {
        return;
    }

    const char* key_start = key;
    const char* key_end = key + key_len;
    const char* data_start = data;
    const char* data_end = data + len;

    while (data_start != data_end) {
        *data_start = *data_start ^ *key_start;
        key_start = (key_start == key_end) ? key : key_start + 1;
        data_start++;
    }
}

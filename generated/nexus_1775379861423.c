#include <stddef.h>

bool hex_to_bytes(const char* hex, unsigned char* bytes, size_t* out_len) {
    if (hex == NULL || bytes == NULL || out_len == NULL) {
        return false;
    }

    size_t hex_len = strlen(hex);
    if (hex_len % 2 != 0) {
        return false;
    }

    size_t byte_len = hex_len / 2;
    if (byte_len > *out_len) {
        return false;
    }

    size_t i = 0;
    while (i < byte_len) {
        char hex_char = hex[i * 2];
        if ((hex_char < '0' || hex_char > '9') && (hex_char < 'a' || hex_char > 'f') && (hex_char < 'A' || hex_char > 'F')) {
            return false;
        }

        char hex_char2 = hex[i * 2 + 1];
        if ((hex_char2 < '0' || hex_char2 > '9') && (hex_char2 < 'a' || hex_char2 > 'f') && (hex_char2 < 'A' || hex_char2 > 'F')) {
            return false;
        }

        unsigned char byte = 0;
        if (hex_char >= '0' && hex_char <= '9') {
            byte = (hex_char - '0') << 4;
        } else if (hex_char >= 'a' && hex_char <= 'f') {
            byte = (hex_char - 'a' + 10) << 4;
        } else {
            byte = (hex_char - 'A' + 10) << 4;
        }

        if (hex_char2 >= '0' && hex_char2 <= '9') {
            byte |= hex_char2 - '0';
        } else if (hex_char2 >= 'a' && hex_char2 <= 'f') {
            byte |= hex_char2 - 'a' + 10;
        } else {
            byte |= hex_char2 - 'A' + 10;
        }

        bytes[i] = byte;
        i++;
    }

    *out_len = byte_len;
    return true;
}

#include <stdlib.h>
#include <stdio.h>

char* reverse_string(const char* input) {
    if (input == NULL) {
        return NULL;
    }

    int length = 0;
    while (*input != '\0') {
        input++;
        length++;
    }

    char* reversed = malloc((length + 1) * sizeof(char));
    if (reversed == NULL) {
        return NULL;
    }

    char* start = reversed;
    const char* end = input - 1;

    while (start <= end) {
        *start = *end;
        start++;
        end--;
    }

    *start = '\0';

    return reversed;
}

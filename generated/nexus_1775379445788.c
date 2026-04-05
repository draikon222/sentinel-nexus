#include <stdlib.h>
#include <stdio.h>

char* reverse_string(const char* input) {
    if (input == NULL) {
        return NULL;
    }

    int length = 0;
    const char* start = input;
    while (*start != '\0') {
        start++;
        length++;
    }

    char* reversed = malloc((length + 1) * sizeof(char));
    if (reversed == NULL) {
        return NULL;
    }

    for (int i = 0; i < length; i++) {
        reversed[i] = input[length - 1 - i];
    }

    reversed[length] = '\0';

    return reversed;
}

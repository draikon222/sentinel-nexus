#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>

#define CAPACITATE_INICIAL 10

typedef struct {
    int* elemente;
    int dim;
    int capacitate;
    pthread_mutex_t mutex;
} DynamicArray;

DynamicArray* crea_vector() {
    DynamicArray* vector = (DynamicArray*) malloc(sizeof(DynamicArray));
    vector->elemente = (int*) malloc(CAPACITATE_INICIAL * sizeof(int));
    vector->dim = 0;
    vector->capacitate = CAPACITATE_INICIAL;
    pthread_mutex_init(&vector->mutex, NULL);
    return vector;
}

void push(DynamicArray* vector, int element) {
    pthread_mutex_lock(&vector->mutex);
    if (vector->dim == vector->capacitate) {
        // Realaocare necesară
        int* noua_memorie = (int*) realloc(vector->elemente, (vector->capacitate * 2) * sizeof(int));
        if (noua_memorie == NULL) {
            // Realaocare eșuată, eliberăm memoria veche
            free(vector->elemente);
            pthread_mutex_unlock(&vector->mutex);
            return;
        }
        vector->elemente = noua_memorie;
        vector->capacitate *= 2;
    }
    vector->elemente[vector->dim] = element;
    vector->dim++;
    pthread_mutex_unlock(&vector->mutex);
}

int get(DynamicArray* vector, int index) {
    pthread_mutex_lock(&vector->mutex);
    if (index < 0 || index >= vector->dim) {
        pthread_mutex_unlock(&vector->mutex);
        return -1; // Index invalid
    }
    int element = vector->elemente[index];
    pthread_mutex_unlock(&vector->mutex);
    return element;
}

void resize(DynamicArray* vector, int noua_capacitate) {
    pthread_mutex_lock(&vector->mutex);
    if (noua_capacitate <= vector->dim) {
        pthread_mutex_unlock(&vector->mutex);
        return; // Noua capacitate nu este mai mare decât dimensiunea curentă
    }
    int* noua_memorie = (int*) realloc(vector->elemente, noua_capacitate * sizeof(int));
    if (noua_memorie == NULL) {
        // Realaocare eșuată, eliberăm memoria veche
        free(vector->elemente);
        pthread_mutex_unlock(&vector->mutex);
        return;
    }
    vector->elemente = noua_memorie;
    vector->capacitate = noua_capacitate;
    pthread_mutex_unlock(&vector->mutex);
}

void elibereaza_vector(DynamicArray* vector) {
    pthread_mutex_lock(&vector->mutex);
    free(vector->elemente);
    pthread_mutex_unlock(&vector->mutex);
    pthread_mutex_destroy(&vector->mutex);
    free(vector);
}

int main() {
    DynamicArray* vector = crea_vector();
    push(vector, 10);
    push(vector, 20);
    printf("%d\n", get(vector, 0)); // 10
    resize(vector, 20);
    return 0;
}

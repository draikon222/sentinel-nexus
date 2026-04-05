#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <stdatomic.h>

#define MAX_ELEMENTE 100
#define CAPACITATE 100

typedef struct {
    int* elemente;
    atomic_int cap;
    atomic_int dim;
} Queue;

Queue* crea_coada() {
    Queue* coada = (Queue*) malloc(sizeof(Queue));
    coada->elemente = (int*) malloc(CAPACITATE * sizeof(int));
    atomic_init(&coada->cap, 0);
    atomic_init(&coada->dim, 0);
    return coada;
}

void adauga_element(Queue* coada, int element) {
    int index = atomic_fetch_add(&coada->cap, 1) % CAPACITATE;
    while (atomic_compare_exchange_strong(&coada->dim, &coada->dim, coada->dim + 1)) {
        // Încercăm să adăugăm elementul la coadă
        coada->elemente[index] = element;
    }
}

int extrage_element(Queue* coada) {
    if (atomic_load(&coada->dim) == 0) {
        // Coada este goală
        return -1;
    }
    int element = coada->elemente[atomic_fetch_sub(&coada->cap, 1) % CAPACITATE];
    return element;
}

int main() {
    Queue* coada = crea_coada();
    adauga_element(coada, 10);
    adauga_element(coada, 20);
    printf("%d\n", extrage_element(coada)); // 10
    printf("%d\n", extrage_element(coada)); // 20
    return 0;
}

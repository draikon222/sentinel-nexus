#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <stdatomic.h>

#define MAX_ELEMENTE 100
#define CAPACITATE 100

typedef struct {
    int* elemente;
    atomic_int head;
    atomic_int tail;
    atomic_int dim;
} Queue;

Queue* crea_coada() {
    Queue* coada = (Queue*) malloc(sizeof(Queue));
    coada->elemente = (int*) malloc(CAPACITATE * sizeof(int));
    atomic_init(&coada->head, 0);
    atomic_init(&coada->tail, 0);
    atomic_init(&coada->dim, 0);
    return coada;
}

void adauga_element(Queue* coada, int element) {
    int index = atomic_fetch_add(&coada->tail, 1) % CAPACITATE;
    while (atomic_load(&coada->dim) == CAPACITATE) {
        // Coada este plină
        return;
    }
    coada->elemente[index] = element;
    atomic_fetch_add(&coada->dim, 1);
}

int extrage_element(Queue* coada) {
    if (atomic_load(&coada->dim) == 0) {
        // Coada este goală
        return -1;
    }
    int element = coada->elemente[atomic_fetch_add(&coada->head, 1) % CAPACITATE];
    atomic_fetch_sub(&coada->dim, 1);
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

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_CELULE 1000
#define MAX_DIMENSIUNE 100

typedef struct {
    int dimensiune;
    int maxim_celule;
    int* celule;
} HashareSpațiala;

HashareSpațiala* crea_hashare_spațiala(int maxim_celule, int dimensiune) {
    HashareSpațiala* hashare = (HashareSpațiala*) malloc(sizeof(HashareSpațiala));
    hashare->maxim_celule = maxim_celule;
    hashare->dimensiune = dimensiune;
    hashare->celule = (int*) malloc(maxim_celule * sizeof(int));
    return hashare;
}

void adauga_element(HashareSpațiala* hashare, int element) {
    int index = element % hashare->maxim_celule;
    if (hashare->celule[index] == 0) {
        hashare->celule[index] = element;
    } else {
        // Implementare alogoritmului de inserare în celula existentă
        // ...
    }
}

int cautare(HashareSpațiala* hashare, int element) {
    int index = element % hashare->maxim_celule;
    return hashare->celule[index] == element;
}

void elibereaza_hashare_spațiala(HashareSpațiala* hashare) {
    free(hashare->celule);
    free(hashare);
}

int main() {
    HashareSpațiala* hashare = crea_hashare_spațiala(MAX_CELULE, MAX_DIMENSIUNE);
    adauga_element(hashare, 10);
    adauga_element(hashare, 20);
    printf("%d\n", cautare(hashare, 10)); // 1
    printf("%d\n", cautare(hashare, 20)); // 1
    elibereaza_hashare_spațiala(hashare);
    return 0;
}

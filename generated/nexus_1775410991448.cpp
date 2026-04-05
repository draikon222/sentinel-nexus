#include <atomic>
#include <thread>
#include <iostream>

template <typename T>
class SPSCQueue {
public:
    SPSCQueue() : head_(nullptr), tail_(nullptr), size_(0) {}

    void push(T value) {
        Node* node = new Node(value);
        node->next = nullptr;

        while (true) {
            Node* prev_tail = tail_.exchange(node, std::memory_order_acquire);
            if (prev_tail == nullptr || prev_tail->next == nullptr) {
                if (prev_tail == nullptr) {
                    head_ = node;
                }
                prev_tail->next = node;
                size_.fetch_add(1, std::memory_order_release);
                return;
            }
        }
    }

    T pop() {
        while (true) {
            Node* prev_head = head_.exchange(nullptr, std::memory_order_acquire);
            if (prev_head == nullptr) {
                return T(); // return default value
            }

            Node* prev_tail = tail_.load(std::memory_order_acquire);
            if (prev_head == prev_tail) {
                delete prev_head;
                head_ = nullptr;
                tail_ = nullptr;
                size_.store(0, std::memory_order_release);
                return T(); // return default value
            }

            T value = prev_head->value;
            Node* next_node = prev_head->next;
            delete prev_head;
            head_ = next_node;
            size_.fetch_sub(1, std::memory_order_release);
            return value;
        }
    }

    bool empty() const {
        return size_.load(std::memory_order_acquire) == 0;
    }

    size_t size() const {
        return size_.load(std::memory_order_acquire);
    }

private:
    struct Node {
        T value;
        Node* next;
    };

    std::atomic<Node*> head_;
    std::atomic<Node*> tail_;
    std::atomic<size_t> size_;
};

int main() {
    SPSCQueue<int> queue;

    std::thread producer([&queue]() {
        for (int i = 0; i < 1000; ++i) {
            queue.push(i);
        }
    });

    std::thread consumer([&queue]() {
        while (!queue.empty()) {
            int value = queue.pop();
            std::cout << value << std::endl;
        }
    });

    producer.join();
    consumer.join();

    return 0;
}

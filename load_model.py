import pickle
import sys

def load_model():
    try:
        with open('model.pkl', 'rb') as f:
            model = pickle.load(f)
            print("Model loaded successfully:", model)
            return model
    except Exception as e:
        print("Error loading model:", e)
        sys.exit(1)

if __name__ == '__main__':
    load_model()

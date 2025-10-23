import os
import json
""" import threading
import subprocess """
from flask_cors import CORS
from dotenv import load_dotenv
from flask import Flask, request, jsonify

load_dotenv()

app = Flask(__name__)
CORS(app)

DB_FILE = os.path.join(os.path.dirname(__file__), "db.json")

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")


# Helper Functions

def read_db():
    if not os.path.exists(DB_FILE):
        with open(DB_FILE, "w") as f:
            json.dump({"rules": [], "contributors": []}, f)
    with open(DB_FILE, "r") as f:
        return json.load(f)


def write_db(data):
    with open(DB_FILE, "w") as f:
        json.dump(data, f, indent=2)


""" def push_db_to_github():
    repo_url = f"https://{os.getenv('GITHUB_TOKEN')}@github.com/{os.getenv('GITHUB_REPO')}.git"
    branch = os.getenv("GITHUB_BRANCH", "main")

    subprocess.run(["git", "add", "db.json"])
    subprocess.run(
        ["git", "commit", "-m", "Update db.json"],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )
    subprocess.run(
        ["git", "push", repo_url, branch],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )

def push_db_async():
    thread = threading.Thread(target=push_db_to_github)
    thread.start() """


# Routes

@app.route("/api/rules", methods=["GET"])
def get_rules():
    db = read_db()
    return jsonify(db["rules"])


@app.route("/api/rules", methods=["POST"])
def add_rule():
    data = request.get_json()
    password = data.get("password")
    rule = data.get("rule")

    if password != ADMIN_PASSWORD:
        return jsonify({"error": "Unauthorized"}), 403

    db = read_db()
    db["rules"].append(rule)
    write_db(db)
    return jsonify(
        {"message": "Rule added", "rules": db["rules"]}
    )


@app.route("/api/rules/<int:index>", methods=["DELETE"])
def delete_rule(index):
    password = request.args.get("password")

    if password != ADMIN_PASSWORD:
        return jsonify({"error": "Unauthorized"}), 403

    db = read_db()
    if 0 <= index < len(db["rules"]):
        db["rules"].pop(index)
        write_db(db)
        return jsonify(
            {"message": "Rule deleted", "rules": db["rules"]}
        )
    else:
        return jsonify({"error": "Invalid index"}), 400


@app.route("/api/contributors", methods=["GET"])
def get_contributors():
    db = read_db()
    return jsonify(db["contributors"])


@app.route("/api/contributors", methods=["POST"])
def add_contributor():
    data = request.get_json()
    db = read_db()
    db["contributors"].append(data)
    write_db(db)
    return jsonify({"message": "Contributor added",
                   "contributors": db["contributors"]})


@app.route("/api/contributors/<int:index>", methods=["DELETE"])
def delete_contributor(index):
    password = request.args.get("password")

    if password != ADMIN_PASSWORD:
        return jsonify({"error": "Unauthorized"}), 403

    db = read_db()
    if 0 <= index < len(db["contributors"]):
        db["contributors"].pop(index)
        write_db(db)
        return jsonify({"message": "Contributor deleted",
                       "contributors": db["contributors"]})
    else:
        return jsonify({"error": "Invalid index"}), 400


@app.route("/api/check_admin", methods=["POST"])
def check_admin():
    data = request.get_json()
    password = data.get("password")
    if password == ADMIN_PASSWORD:
        return jsonify({"admin": True})
    return jsonify({"admin": False}), 403


""" if __name__ == "__main__":
    app.run(debug=True) """

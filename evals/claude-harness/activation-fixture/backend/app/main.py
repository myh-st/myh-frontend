from fastapi import FastAPI
from pydantic import BaseModel, field_validator

app = FastAPI()

class TicketIn(BaseModel):
    title: str
    priority: int  # 1..5

    @field_validator("priority")
    @classmethod
    def check_priority(cls, v):
        if v < 1 or v > 5:
            return v  # BUG: should raise
        return v

@app.post("/api/tickets")
def create_ticket(t: TicketIn):
    return {"ok": True, "priority": t.priority}

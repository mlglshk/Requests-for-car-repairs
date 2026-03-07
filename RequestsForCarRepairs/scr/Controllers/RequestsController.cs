using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RequestsForCarRepairs.API.Models;
using RequestsForCarRepairs.API.Data;

namespace RequestsForCarRepairs.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RequestsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RequestsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Requests
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetRequests() // ИЗМЕНЕНО: возвращаем object вместо Request
        {
            try
            {
                // ИЗМЕНЕНО: выбираем только нужные поля, без навигационных свойств
                var requests = await _context.Requests
                    .Select(r => new
                    {
                        r.RequestID,
                        r.StartDate,
                        r.CarType,
                        r.CarModel,
                        r.ProblemDescription,
                        r.RequestStatus,
                        r.CompletionDate,
                        r.RepairParts,
                        r.MasterID,
                        r.ClientID
                    })
                    .ToListAsync();

                return Ok(requests);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Ошибка: {ex.Message}");
            }
        }

        // GET: api/Requests/5
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetRequest(int id) // ИЗМЕНЕНО: возвращаем object
        {
            try
            {
                var request = await _context.Requests
                    .Where(r => r.RequestID == id)
                    .Select(r => new
                    {
                        r.RequestID,
                        r.StartDate,
                        r.CarType,
                        r.CarModel,
                        r.ProblemDescription,
                        r.RequestStatus,
                        r.CompletionDate,
                        r.RepairParts,
                        r.MasterID,
                        r.ClientID
                    })
                    .FirstOrDefaultAsync();

                if (request == null)
                {
                    return NotFound();
                }

                return Ok(request);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Ошибка: {ex.Message}");
            }
        }

        // PUT: api/Requests/5 - полное обновление
        [HttpPut("{id}")]
        public async Task<IActionResult> PutRequest(int id, Request request)
        {
            if (id != request.RequestID)
            {
                return BadRequest();
            }

            try
            {
                _context.Entry(request).State = EntityState.Modified;
                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        // POST: api/Requests/5 - частичное обновление (для совместимости)
        [HttpPost("{id}")]
        public async Task<IActionResult> UpdateRequest(int id, [FromBody] UpdateRequestModel model)
        {
            try
            {
                var request = await _context.Requests.FindAsync(id);
                if (request == null) return NotFound();

                if (model.MasterId != null) request.MasterID = model.MasterId;
                if (!string.IsNullOrEmpty(model.Status))
                {
                    request.RequestStatus = model.Status;
                    if (model.Status == "Готова к выдаче")
                    {
                        request.CompletionDate = DateTime.Now;
                    }
                }

                await _context.SaveChangesAsync();
                return Ok(new { message = "Заявка обновлена" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        // POST: api/Requests - создание новой заявки
        [HttpPost]
        public async Task<ActionResult<Request>> PostRequest([FromBody] CreateRequestModel model)
        {
            try
            {
                var request = new Request
                {
                    CarType = model.CarType,
                    CarModel = model.CarModel,
                    ProblemDescription = model.ProblemDescription,
                    ClientID = model.ClientId,
                    RequestStatus = "Новая заявка",
                    StartDate = DateTime.UtcNow,
                    MasterID = null,
                    CompletionDate = null,
                    RepairParts = null
                };

                _context.Requests.Add(request);
                await _context.SaveChangesAsync();

                // ИЗМЕНЕНО: возвращаем созданный объект
                return CreatedAtAction(nameof(GetRequest), new { id = request.RequestID }, request);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Ошибка: {ex.Message}");
            }
        }

        // DELETE: api/Requests/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRequest(int id)
        {
            try
            {
                var request = await _context.Requests.FindAsync(id);
                if (request == null)
                {
                    return NotFound();
                }

                _context.Requests.Remove(request);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        // Модели
        public class UpdateRequestModel
        {
            public int? MasterId { get; set; }
            public string? Status { get; set; }
        }

        public class CreateRequestModel
        {
            public string CarType { get; set; } = string.Empty;
            public string CarModel { get; set; } = string.Empty;
            public string ProblemDescription { get; set; } = string.Empty;
            public int ClientId { get; set; }
        }
    }
}
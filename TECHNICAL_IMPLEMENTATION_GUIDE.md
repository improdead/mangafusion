# Technical Implementation Guide: Sketch-to-Manga APIs

## Architecture Overview

```
User Sketch Input (PNG/JPEG, 512-1024px)
    ↓
Preprocessing (Optional Edge Detection)
    ↓
API Call (ControlNet / Fine-tuned Model)
    ↓
Generation Pipeline (2-30 seconds)
    ↓
Manga-Style Image Output (1024-2048px)
    ↓
Post-processing (Optional Upscaling/Refinement)
```

---

## API Endpoints Reference

### Segmind ControlNet Scribble

**Endpoint**: `https://api.segmind.com/v1/sd-controlnet-scribble`

**Authentication**: Header-based API key
```bash
Headers:
  x-api-key: YOUR_API_KEY
  Content-Type: application/json
```

**Request Payload**:
```json
{
  "sketch_image": "base64_encoded_image_data",
  "prompt": "manga girl, beautiful, details, anime style",
  "negative_prompt": "blurry, low quality, distorted",
  "guidance_scale": 7.5,
  "num_outputs": 1,
  "num_inference_steps": 20,
  "seed": 0,
  "control_strength": 0.9,
  "sampler": "euler",
  "scheduler": "normal"
}
```

**Response**:
```json
{
  "image_uuid": "uuid-string",
  "images": ["base64_encoded_result"],
  "cost": 0.003
}
```

**Python Implementation**:
```python
import requests
import base64
import json
from pathlib import Path

class SegmindAPI:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.segmind.com/v1"
        self.headers = {"x-api-key": api_key}

    def sketch_to_manga(
        self,
        sketch_path: str,
        prompt: str,
        negative_prompt: str = "blurry, low quality",
        guidance_scale: float = 7.5,
        control_strength: float = 0.9,
        num_steps: int = 20
    ) -> dict:
        """
        Convert sketch to manga image using ControlNet Scribble
        """
        # Read and encode sketch
        with open(sketch_path, "rb") as f:
            sketch_b64 = base64.b64encode(f.read()).decode()

        # Prepare payload
        payload = {
            "sketch_image": sketch_b64,
            "prompt": prompt,
            "negative_prompt": negative_prompt,
            "guidance_scale": guidance_scale,
            "control_strength": control_strength,
            "num_inference_steps": num_steps,
            "num_outputs": 1
        }

        # Make request
        response = requests.post(
            f"{self.base_url}/sd-controlnet-scribble",
            json=payload,
            headers=self.headers,
            timeout=120
        )

        if response.status_code != 200:
            raise Exception(f"API Error: {response.text}")

        result = response.json()

        # Decode and save result
        img_data = base64.b64decode(result["images"][0])

        return {
            "image_data": img_data,
            "cost": result.get("cost", 0),
            "uuid": result.get("image_uuid")
        }

    def get_balance(self) -> dict:
        """Check remaining credits"""
        response = requests.get(
            f"{self.base_url}/account/balance",
            headers=self.headers
        )
        return response.json()
```

---

### Replicate ControlNet

**Endpoint**: https://api.replicate.com/v1/predictions

**Authentication**: Bearer token
```bash
Headers:
  Authorization: Token YOUR_API_TOKEN
  Content-Type: application/json
```

**Request Payload**:
```json
{
  "version": "9f7a769cb03f3e6ef25687ca1a17ce11ec1d10b4feb41b45e2b4e98a1fd92c45",
  "input": {
    "image": "https://url-to-sketch.png",
    "prompt": "manga girl, beautiful, detailed, anime",
    "guidance_scale": 7.5,
    "num_outputs": 1
  },
  "webhook": "https://your-server.com/webhook",
  "webhook_events_filter": ["completed"]
}
```

**Python Implementation**:
```python
import replicate
from pathlib import Path

class ReplicateAPI:
    def __init__(self, api_token: str):
        self.client = replicate.Client(api_token=api_token)

    def sketch_to_manga_sync(
        self,
        sketch_path: str,
        prompt: str,
        guidance_scale: float = 7.5,
        model: str = "scribble"  # or "canny"
    ) -> str:
        """
        Synchronous sketch-to-image conversion
        Returns: URL to generated image
        """
        model_map = {
            "scribble": "jagilley/controlnet-scribble",
            "canny": "jagilley/controlnet-canny"
        }

        with open(sketch_path, "rb") as f:
            output = replicate.run(
                model_map[model],
                input={
                    "image": f,
                    "prompt": prompt,
                    "guidance_scale": guidance_scale,
                    "num_outputs": 1,
                }
            )

        return output[0] if output else None

    def sketch_to_manga_async(
        self,
        sketch_url: str,
        prompt: str,
        webhook_url: str,
        guidance_scale: float = 7.5
    ) -> str:
        """
        Asynchronous sketch-to-image conversion with webhook
        Returns: Prediction ID for polling
        """
        prediction = replicate.predictions.create(
            version="9f7a769cb03f3e6ef25687ca1a17ce11ec1d10b4feb41b45e2b4e98a1fd92c45",
            input={
                "image": sketch_url,
                "prompt": prompt,
                "guidance_scale": guidance_scale,
            },
            webhook=webhook_url,
            webhook_events_filter=["completed"]
        )

        return prediction.id

    def get_prediction_status(self, prediction_id: str) -> dict:
        """Poll prediction status"""
        prediction = replicate.predictions.get(prediction_id)
        return {
            "status": prediction.status,
            "output": prediction.output,
            "error": prediction.error
        }
```

---

### Leonardo AI

**Endpoint**: https://api.leonardo.ai/v1/generations

**Authentication**: Bearer token
```bash
Headers:
  Authorization: Bearer YOUR_API_TOKEN
  Content-Type: application/json
```

**Request Payload for Sketch-to-Image**:
```json
{
  "prompt": "manga girl, beautiful anime style",
  "negative_prompt": "blurry, low quality",
  "imageToUpscaleId": null,
  "modelId": "b24e16ff-06e3-43eb-8039-f42585e55503",
  "width": 1024,
  "height": 1024,
  "num_images": 1,
  "guidance_scale": 7.5,
  "presetStyle": "ANIME"
}
```

**Python Implementation**:
```python
import requests
import time
from typing import Optional

class LeonardoAIAPI:
    def __init__(self, api_token: str):
        self.api_token = api_token
        self.base_url = "https://api.leonardo.ai/v1"
        self.headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json"
        }

    def upload_sketch(self, sketch_path: str) -> str:
        """Upload sketch image and return ID"""
        with open(sketch_path, "rb") as f:
            files = {"file": f}
            response = requests.post(
                f"{self.base_url}/images/upload",
                files=files,
                headers={"Authorization": self.headers["Authorization"]}
            )

        return response.json()["imageId"]

    def sketch_to_manga(
        self,
        sketch_path: str,
        prompt: str,
        guidance_scale: float = 7.5,
        model_id: str = "b24e16ff-06e3-43eb-8039-f42585e55503"  # Latest anime model
    ) -> Optional[str]:
        """
        Convert sketch to manga using Leonardo AI
        Returns: URL to generated image
        """
        # Upload sketch
        sketch_id = self.upload_sketch(sketch_path)

        # Generate image
        payload = {
            "prompt": prompt,
            "negative_prompt": "blurry, low quality, distorted",
            "imageToUpscaleId": sketch_id,
            "modelId": model_id,
            "width": 1024,
            "height": 1024,
            "num_images": 1,
            "guidance_scale": guidance_scale,
            "presetStyle": "ANIME"
        }

        response = requests.post(
            f"{self.base_url}/generations",
            json=payload,
            headers=self.headers
        )

        generation_id = response.json()["generationId"]

        # Poll for completion
        return self._wait_for_generation(generation_id)

    def _wait_for_generation(
        self,
        generation_id: str,
        max_wait: int = 300
    ) -> Optional[str]:
        """Poll until generation completes"""
        start_time = time.time()

        while time.time() - start_time < max_wait:
            response = requests.get(
                f"{self.base_url}/generations/{generation_id}",
                headers=self.headers
            )

            status = response.json()

            if status["generation"]["status"] == "COMPLETE":
                images = status["generation"]["generated_images"]
                return images[0]["url"] if images else None

            time.sleep(2)

        raise TimeoutError(f"Generation {generation_id} timed out")

    def get_user_info(self) -> dict:
        """Get user account info and remaining tokens"""
        response = requests.get(
            f"{self.base_url}/user/me",
            headers=self.headers
        )
        return response.json()
```

---

### Google Gemini Image Generation

**Endpoint**: https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate

**Authentication**: API Key
```bash
Query Parameter:
  key=YOUR_API_KEY
```

**Request Payload**:
```json
{
  "system_instruction": "You are an expert manga artist. Generate a refined manga-style image based on the sketch provided.",
  "contents": [{
    "role": "user",
    "parts": [
      {
        "inline_data": {
          "mime_type": "image/png",
          "data": "base64_sketch_data"
        }
      },
      {
        "text": "Convert this sketch into a beautiful manga-style illustration with the following details: beautiful girl, anime eyes, detailed hair, manga style"
      }
    ]
  }],
  "generation_config": {
    "temperature": 0.9,
    "top_p": 0.95,
    "max_output_tokens": 8096
  }
}
```

**Python Implementation**:
```python
import anthropic
import base64
import json
from pathlib import Path

class GeminiImageAPI:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = anthropic.Anthropic(api_key=api_key)

    def sketch_to_manga(
        self,
        sketch_path: str,
        prompt: str,
        model: str = "claude-3-5-sonnet-20241022"
    ) -> dict:
        """
        Convert sketch to manga using Gemini multimodal understanding
        """
        # Read and encode sketch
        with open(sketch_path, "rb") as f:
            sketch_b64 = base64.standard_b64encode(f.read()).decode("utf-8")

        # Create message with multimodal input
        message = self.client.messages.create(
            model=model,
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/png",
                                "data": sketch_b64,
                            },
                        },
                        {
                            "type": "text",
                            "text": f"""You are an expert manga artist. Analyze this sketch and provide a detailed prompt
for generating a refined manga-style image. The image should have:
- Clean manga-style linework
- Proper anatomy and proportions
- Appropriate shading and details
- Anime aesthetic

Original request: {prompt}

Provide a comprehensive generation prompt that a text-to-image model could use."""
                        }
                    ],
                }
            ],
        )

        return {
            "analysis": message.content[0].text,
            "usage": {
                "input_tokens": message.usage.input_tokens,
                "output_tokens": message.usage.output_tokens
            }
        }

    def analyze_sketch_for_improvement(self, sketch_path: str) -> dict:
        """
        Analyze sketch and suggest improvements
        """
        with open(sketch_path, "rb") as f:
            sketch_b64 = base64.standard_b64encode(f.read()).decode("utf-8")

        message = self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/png",
                                "data": sketch_b64,
                            },
                        },
                        {
                            "type": "text",
                            "text": """Analyze this manga sketch and provide:
1. Strengths (what works well)
2. Areas for improvement
3. Suggestions for manga-style enhancement
4. Recommended text prompts for AI generation

Format as JSON with these keys: strengths, improvements, suggestions, prompts"""
                        }
                    ],
                }
            ],
        )

        return json.loads(message.content[0].text)
```

---

## Input Format Specifications

### Optimal Sketch Format

**Resolution**:
```
Minimum: 512x512px
Recommended: 768x768px - 1024x1024px
Maximum: 2048x2048px (diminishing returns)

For production: Use 1024x1024px as standard
```

**Color Space**:
```
RGB (Recommended)
RGBA (with transparency - will be converted to white background)
Grayscale (auto-converted to RGB)

AVOID: CMYK, indexed color
```

**File Format**:
```
PNG (Recommended)
  - No compression artifacts
  - Supports transparency
  - ~2-3x larger than JPEG

JPEG (Acceptable)
  - Smaller file size
  - Compression artifacts at high quality
  - Use quality=95+

SVG (Limited Support)
  - Some APIs convert to raster automatically
  - Test before production use
```

**Sketch Quality Requirements**:
```
Line Weight: 2-4px minimum visible thickness
Contrast: High (dark lines on light background)
Smoothness: ~2-3 pixels anti-aliasing acceptable
Detail Level: More detail = more faithful output

Good Practice:
- Black (#000000) or dark gray (#333333) lines
- White (#FFFFFF) or light gray (#F5F5F5) background
- Consistent line weight
- Clear separation between elements
```

### Example Preprocessing

```python
from PIL import Image
import numpy as np

def prepare_sketch_for_api(
    sketch_path: str,
    target_size: int = 1024,
    enhance_contrast: bool = True
) -> Image.Image:
    """Prepare sketch image for API submission"""

    # Open image
    img = Image.open(sketch_path)

    # Convert to RGB if needed
    if img.mode != "RGB":
        img = img.convert("RGB")

    # Resize maintaining aspect ratio
    img.thumbnail((target_size, target_size), Image.Resampling.LANCZOS)

    # Pad to exact size
    new_img = Image.new("RGB", (target_size, target_size), color="white")
    offset = ((target_size - img.size[0]) // 2, (target_size - img.size[1]) // 2)
    new_img.paste(img, offset)

    # Optional: Enhance contrast
    if enhance_contrast:
        arr = np.array(new_img)

        # Convert to grayscale for analysis
        gray = np.mean(arr, axis=2)

        # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
        from cv2 import createCLAHE
        clahe = createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply((gray * 255).astype(np.uint8))

        # Convert back to RGB
        new_img = Image.fromarray(np.stack([enhanced] * 3, axis=2))

    return new_img
```

---

## Batch Processing Implementation

### Async Processing with Queue

```python
import asyncio
import json
from dataclasses import dataclass
from enum import Enum
from typing import Callable, Optional
import time

class ProcessingStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

@dataclass
class ProcessingJob:
    job_id: str
    sketch_path: str
    prompt: str
    status: ProcessingStatus = ProcessingStatus.PENDING
    result: Optional[str] = None
    error: Optional[str] = None
    created_at: float = None
    completed_at: Optional[float] = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = time.time()

class SketchProcessingQueue:
    def __init__(
        self,
        api_handler: Callable,
        max_concurrent: int = 3,
        max_retries: int = 3
    ):
        self.api_handler = api_handler
        self.max_concurrent = max_concurrent
        self.max_retries = max_retries
        self.jobs = {}
        self.semaphore = asyncio.Semaphore(max_concurrent)

    async def submit_job(
        self,
        job_id: str,
        sketch_path: str,
        prompt: str
    ) -> ProcessingJob:
        """Submit a new processing job"""
        job = ProcessingJob(
            job_id=job_id,
            sketch_path=sketch_path,
            prompt=prompt
        )
        self.jobs[job_id] = job
        return job

    async def process_job(self, job: ProcessingJob, retry: int = 0):
        """Process a single job with retry logic"""
        async with self.semaphore:
            try:
                job.status = ProcessingStatus.PROCESSING

                # Call API
                result = await asyncio.to_thread(
                    self.api_handler,
                    job.sketch_path,
                    job.prompt
                )

                job.result = result
                job.status = ProcessingStatus.COMPLETED
                job.completed_at = time.time()

            except Exception as e:
                if retry < self.max_retries:
                    await asyncio.sleep(2 ** retry)  # Exponential backoff
                    await self.process_job(job, retry + 1)
                else:
                    job.status = ProcessingStatus.FAILED
                    job.error = str(e)
                    job.completed_at = time.time()

    async def process_all_jobs(self):
        """Process all pending jobs"""
        tasks = []
        for job in self.jobs.values():
            if job.status == ProcessingStatus.PENDING:
                tasks.append(self.process_job(job))

        await asyncio.gather(*tasks)

    def get_job_status(self, job_id: str) -> ProcessingJob:
        """Get status of a specific job"""
        return self.jobs.get(job_id)

    def get_all_jobs(self) -> dict:
        """Get all jobs and their statuses"""
        return self.jobs

    def export_results(self, output_path: str):
        """Export all results to JSON"""
        results = {
            job_id: {
                "sketch_path": job.sketch_path,
                "prompt": job.prompt,
                "status": job.status.value,
                "result": job.result,
                "error": job.error,
                "duration": job.completed_at - job.created_at if job.completed_at else None
            }
            for job_id, job in self.jobs.items()
        }

        with open(output_path, "w") as f:
            json.dump(results, f, indent=2)


# Usage Example
async def batch_process_sketches():
    def api_handler(sketch_path, prompt):
        # Your API call here
        from implementation_examples import SegmindAPI
        api = SegmindAPI("YOUR_API_KEY")
        return api.sketch_to_manga(sketch_path, prompt)

    queue = SketchProcessingQueue(api_handler, max_concurrent=3)

    # Submit jobs
    sketches = [
        ("sketch1", "path/to/sketch1.png", "manga girl"),
        ("sketch2", "path/to/sketch2.png", "manga boy"),
        ("sketch3", "path/to/sketch3.png", "anime landscape"),
    ]

    for job_id, path, prompt in sketches:
        await queue.submit_job(job_id, path, prompt)

    # Process all
    await queue.process_all_jobs()

    # Export results
    queue.export_results("results.json")
```

---

## Error Handling & Retry Logic

```python
import requests
from typing import Optional, Callable
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class APIRetryHandler:
    def __init__(
        self,
        max_retries: int = 3,
        base_wait_time: int = 1,
        max_wait_time: int = 60
    ):
        self.max_retries = max_retries
        self.base_wait_time = base_wait_time
        self.max_wait_time = max_wait_time

    def retry_with_backoff(
        self,
        func: Callable,
        *args,
        **kwargs
    ) -> Optional[dict]:
        """
        Execute function with exponential backoff retry
        """
        for attempt in range(self.max_retries + 1):
            try:
                result = func(*args, **kwargs)
                if attempt > 0:
                    logger.info(f"Success on attempt {attempt + 1}")
                return result

            except requests.exceptions.Timeout:
                if attempt < self.max_retries:
                    wait_time = min(
                        self.base_wait_time * (2 ** attempt),
                        self.max_wait_time
                    )
                    logger.warning(f"Timeout on attempt {attempt + 1}, retrying in {wait_time}s")
                    time.sleep(wait_time)
                else:
                    logger.error("Max retries exceeded for timeout")
                    raise

            except requests.exceptions.ConnectionError as e:
                if attempt < self.max_retries:
                    wait_time = min(
                        self.base_wait_time * (2 ** attempt),
                        self.max_wait_time
                    )
                    logger.warning(f"Connection error, retrying in {wait_time}s")
                    time.sleep(wait_time)
                else:
                    logger.error("Max retries exceeded for connection error")
                    raise

            except requests.exceptions.HTTPError as e:
                # Check if retryable
                if e.response.status_code in [429, 503, 504]:
                    if attempt < self.max_retries:
                        # Use Retry-After header if available
                        retry_after = int(e.response.headers.get("Retry-After",
                                         self.base_wait_time * (2 ** attempt)))
                        logger.warning(f"HTTP {e.response.status_code}, retrying in {retry_after}s")
                        time.sleep(retry_after)
                    else:
                        raise
                else:
                    # Non-retryable error
                    logger.error(f"Non-retryable HTTP error: {e}")
                    raise

        raise RuntimeError("All retry attempts exhausted")
```

---

## Monitoring & Logging

```python
import logging
import json
from datetime import datetime
from typing import Dict, Any

class APIUsageMonitor:
    def __init__(self, log_file: str = "api_usage.log"):
        self.log_file = log_file
        self.setup_logger()
        self.usage_stats = {
            "total_requests": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "total_cost": 0.0,
            "total_tokens": 0,
            "requests_by_model": {},
            "errors_by_type": {}
        }

    def setup_logger(self):
        self.logger = logging.getLogger("APIUsage")
        handler = logging.FileHandler(self.log_file)
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)

    def log_request(
        self,
        model: str,
        input_size: int,
        success: bool,
        cost: float = 0.0,
        error: str = None,
        duration: float = None
    ):
        """Log API request details"""
        self.usage_stats["total_requests"] += 1

        if success:
            self.usage_stats["successful_requests"] += 1
        else:
            self.usage_stats["failed_requests"] += 1
            if error:
                error_type = error.split(":")[0]
                self.usage_stats["errors_by_type"][error_type] = \
                    self.usage_stats["errors_by_type"].get(error_type, 0) + 1

        self.usage_stats["total_cost"] += cost

        if model not in self.usage_stats["requests_by_model"]:
            self.usage_stats["requests_by_model"][model] = {
                "count": 0,
                "cost": 0.0,
                "avg_duration": 0.0
            }

        model_stats = self.usage_stats["requests_by_model"][model]
        model_stats["count"] += 1
        model_stats["cost"] += cost

        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "model": model,
            "success": success,
            "cost": cost,
            "input_size": input_size,
            "duration": duration,
            "error": error
        }

        self.logger.info(json.dumps(log_entry))

    def get_statistics(self) -> Dict[str, Any]:
        """Get usage statistics"""
        return {
            **self.usage_stats,
            "success_rate": self.usage_stats["successful_requests"] / \
                           max(self.usage_stats["total_requests"], 1) * 100,
            "avg_cost_per_request": self.usage_stats["total_cost"] / \
                                   max(self.usage_stats["successful_requests"], 1)
        }

    def print_report(self):
        """Print formatted usage report"""
        stats = self.get_statistics()
        print("\n=== API Usage Report ===")
        print(f"Total Requests: {stats['total_requests']}")
        print(f"Successful: {stats['successful_requests']}")
        print(f"Failed: {stats['failed_requests']}")
        print(f"Success Rate: {stats['success_rate']:.1f}%")
        print(f"Total Cost: ${stats['total_cost']:.2f}")
        print(f"Avg Cost/Request: ${stats['avg_cost_per_request']:.4f}")
        print("\nBy Model:")
        for model, data in stats['requests_by_model'].items():
            print(f"  {model}: {data['count']} requests, ${data['cost']:.2f}")
```

---

## Performance Optimization Tips

### 1. Image Preprocessing
```python
# Resize before upload (reduce data transfer)
def optimize_image(path: str, max_size: int = 1024):
    from PIL import Image
    img = Image.open(path)
    img.thumbnail((max_size, max_size))
    optimized_path = path.replace('.png', '_optimized.png')
    img.save(optimized_path, quality=95, optimize=True)
    return optimized_path
```

### 2. Concurrent Requests
```python
import concurrent.futures

def batch_generate(sketches: list, api_handler, max_workers: int = 5):
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [
            executor.submit(api_handler, sketch_path, prompt)
            for sketch_path, prompt in sketches
        ]
        results = [f.result() for f in concurrent.futures.as_completed(futures)]
    return results
```

### 3. Caching Results
```python
import hashlib
from pathlib import Path

class ResultCache:
    def __init__(self, cache_dir: str = "./cache"):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)

    def get_cache_key(self, sketch_path: str, prompt: str) -> str:
        """Generate cache key from sketch and prompt"""
        content = f"{sketch_path}:{prompt}".encode()
        return hashlib.sha256(content).hexdigest()

    def get(self, sketch_path: str, prompt: str) -> Optional[str]:
        """Get cached result if exists"""
        cache_file = self.cache_dir / f"{self.get_cache_key(sketch_path, prompt)}.png"
        return str(cache_file) if cache_file.exists() else None

    def set(self, sketch_path: str, prompt: str, result: bytes):
        """Cache result"""
        cache_file = self.cache_dir / f"{self.get_cache_key(sketch_path, prompt)}.png"
        cache_file.write_bytes(result)
```

---

## Deployment Configuration

### Environment Variables
```bash
# .env file
SEGMIND_API_KEY=your_key_here
REPLICATE_API_KEY=your_key_here
LEONARDO_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here

# Configuration
API_TIMEOUT=120
MAX_CONCURRENT_REQUESTS=3
RETRY_ATTEMPTS=3
SKETCH_MAX_SIZE=1024
```

### Docker Deployment
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV API_TIMEOUT=120
ENV MAX_CONCURRENT_REQUESTS=3

CMD ["python", "app.py"]
```

---

## Testing

```python
import unittest
from unittest.mock import patch, MagicMock
import json

class TestSketchToMangaAPI(unittest.TestCase):
    def setUp(self):
        self.api = SegmindAPI("test_key")

    @patch('requests.post')
    def test_sketch_to_manga_success(self, mock_post):
        """Test successful image generation"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "images": ["base64_image_data"],
            "cost": 0.003,
            "image_uuid": "test-uuid"
        }
        mock_post.return_value = mock_response

        result = self.api.sketch_to_manga(
            "test_sketch.png",
            "manga girl"
        )

        self.assertIsNotNone(result)
        self.assertEqual(result["cost"], 0.003)
        self.assertEqual(result["uuid"], "test-uuid")

    @patch('requests.post')
    def test_sketch_to_manga_api_error(self, mock_post):
        """Test API error handling"""
        mock_post.side_effect = requests.ConnectionError("Network error")

        with self.assertRaises(requests.ConnectionError):
            self.api.sketch_to_manga("test_sketch.png", "manga girl")

    def test_image_preprocessing(self):
        """Test image preprocessing"""
        from PIL import Image
        import tempfile

        # Create test image
        img = Image.new('RGB', (2048, 2048), color='red')
        with tempfile.NamedTemporaryFile(suffix='.png') as f:
            img.save(f.name)
            processed = prepare_sketch_for_api(f.name, target_size=1024)

            self.assertEqual(processed.size, (1024, 1024))
            self.assertEqual(processed.mode, 'RGB')
```

---

**Last Updated**: November 2025
**Documentation Version**: 2.0
